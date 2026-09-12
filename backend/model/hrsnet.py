"""
HRS-Net: Hybrid Restormer-Swin-Wavelet Deraining Network
Exact structural replica from training/inference source code.
Architecture source-of-truth: user's provided inference.py
"""

import torch
import torch.nn as nn
import torch.nn.functional as F


# ===================== WAVELET TRANSFORMS =====================

class DWT(nn.Module):
    """Discrete Wavelet Transform (Haar) — custom implementation per source."""

    def forward(self, x):
        B, C, H, W = x.shape
        x = x.reshape(B, C, H // 2, 2, W // 2, 2)
        x = x.permute(0, 1, 3, 5, 2, 4)
        x = x.reshape(B, C * 4, H // 2, W // 2)
        return x


class IWT(nn.Module):
    """Inverse Discrete Wavelet Transform — custom implementation per source."""

    def forward(self, x):
        B, C, H, W = x.shape
        C = C // 4
        x = x.reshape(B, C, 2, 2, H, W)
        x = x.permute(0, 1, 4, 2, 5, 3)
        x = x.reshape(B, C, H * 2, W * 2)
        return x


# ===================== ATTENTION MODULES =====================

class ChannelAttention(nn.Module):
    def __init__(self, channels, reduction=16):
        super().__init__()
        self.pool = nn.AdaptiveAvgPool2d(1)
        self.fc = nn.Sequential(
            nn.Conv2d(channels, channels // reduction, 1),
            nn.ReLU(inplace=True),
            nn.Conv2d(channels // reduction, channels, 1),
            nn.Sigmoid(),
        )

    def forward(self, x):
        return x * self.fc(self.pool(x))


class SpatialAttention(nn.Module):
    def __init__(self, kernel_size=7):
        super().__init__()
        self.conv = nn.Conv2d(2, 1, kernel_size, padding=kernel_size // 2, bias=False)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        avg_pool = torch.mean(x, dim=1, keepdim=True)
        max_pool, _ = torch.max(x, dim=1, keepdim=True)
        concat = torch.cat([avg_pool, max_pool], dim=1)
        return x * self.sigmoid(self.conv(concat))


class FrequencyAttention(nn.Module):
    def __init__(self, channels):
        super().__init__()
        self.channel_fc = nn.Sequential(
            nn.Conv2d(channels, channels // 16, 1),
            nn.ReLU(inplace=True),
            nn.Conv2d(channels // 16, channels, 1),
            nn.Sigmoid(),
        )

    def forward(self, x):
        x_fft = torch.fft.fft2(x)
        mag = torch.abs(x_fft)
        phase = torch.angle(x_fft)

        mag_pool = torch.mean(mag, dim=(-2, -1), keepdim=True)
        attention = self.channel_fc(mag_pool)
        mag = mag * attention

        x_fft = torch.complex(mag * torch.cos(phase), mag * torch.sin(phase))
        return torch.fft.ifft2(x_fft).real


# ===================== TRANSFORMER BLOCKS =====================

class MDTA(nn.Module):
    def __init__(self, channels, num_heads=8):
        super().__init__()
        self.num_heads = num_heads
        self.temperature = nn.Parameter(torch.ones(num_heads, 1, 1))
        self.qkv = nn.Conv2d(channels, channels * 3, 1)
        self.qkv_dwconv = nn.Conv2d(channels * 3, channels * 3, 3, padding=1, groups=channels * 3)
        self.proj = nn.Conv2d(channels, channels, 1)

    def forward(self, x):
        B, C, H, W = x.shape
        qkv = self.qkv_dwconv(self.qkv(x))
        q, k, v = qkv.chunk(3, dim=1)

        q = q.reshape(B, self.num_heads, C // self.num_heads, H * W)
        k = k.reshape(B, self.num_heads, C // self.num_heads, H * W)
        v = v.reshape(B, self.num_heads, C // self.num_heads, H * W)

        q = F.normalize(q, dim=-2)
        k = F.normalize(k, dim=-2)

        attn = (q @ k.transpose(-2, -1)) * self.temperature
        attn = attn.softmax(dim=-1)

        out = (attn @ v).reshape(B, C, H, W)
        return self.proj(out)


class GDFN(nn.Module):
    def __init__(self, channels, expansion_ratio=2.66):
        super().__init__()
        hidden_channels = int(channels * expansion_ratio)
        self.proj_1 = nn.Conv2d(channels, hidden_channels, 1)
        self.proj_1_act = nn.GELU()
        self.spatial_gating = nn.Conv2d(hidden_channels, hidden_channels, 3, padding=1, groups=hidden_channels)
        self.proj_2 = nn.Conv2d(hidden_channels, channels, 1)

    def forward(self, x):
        shortcut = x
        x = self.proj_1(x)
        x = self.proj_1_act(x)
        x = self.spatial_gating(x)
        x = self.proj_2(x)
        return x + shortcut


class TransformerBlock(nn.Module):
    def __init__(self, channels, num_heads=8):
        super().__init__()
        self.norm1 = nn.GroupNorm(1, channels)
        self.attn = MDTA(channels, num_heads)
        self.norm2 = nn.GroupNorm(1, channels)
        self.ffn = GDFN(channels)

    def forward(self, x):
        x = x + self.attn(self.norm1(x))
        x = x + self.ffn(self.norm2(x))
        return x


# ===================== HRS-NET MODEL =====================

class HRSNet(nn.Module):
    """Hybrid Restormer-Swin-Wavelet Deraining Network."""

    def __init__(self, in_channels=3, channels=64, num_blocks=12, num_heads=8):
        super().__init__()
        self.in_channels = in_channels
        self.channels = channels

        self.dwt = DWT()
        self.iwt = IWT()

        self.head = nn.Conv2d(in_channels * 4, channels, 3, padding=1)

        self.down1 = nn.Conv2d(channels, channels, 4, stride=2, padding=1)
        self.down2 = nn.Conv2d(channels, channels, 4, stride=2, padding=1)

        self.transformer_full = nn.Sequential(
            *[TransformerBlock(channels, num_heads) for _ in range(num_blocks // 3)]
        )
        self.transformer_half = nn.Sequential(
            *[TransformerBlock(channels, num_heads) for _ in range(num_blocks // 3)]
        )
        self.transformer_quarter = nn.Sequential(
            *[TransformerBlock(channels, num_heads) for _ in range(num_blocks // 3)]
        )

        self.restormer_extra1 = TransformerBlock(channels, num_heads)
        self.restormer_extra2 = TransformerBlock(channels, num_heads)
        self.freq_attn = FrequencyAttention(channels)

        self.channel_attn = ChannelAttention(channels)
        self.spatial_attn = SpatialAttention()

        self.up1 = nn.ConvTranspose2d(channels, channels, 4, stride=2, padding=1)
        self.up2 = nn.ConvTranspose2d(channels, channels, 4, stride=2, padding=1)

        self.fusion1 = nn.Conv2d(channels * 2, channels, 1)
        self.fusion2 = nn.Conv2d(channels * 2, channels, 1)

        self.tail = nn.Sequential(
            nn.Conv2d(channels, channels, 3, padding=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(channels, in_channels * 4, 3, padding=1),
        )

    def forward(self, x):
        x_dwt = self.dwt(x)
        feat = self.head(x_dwt)
        feat_0 = feat

        feat_1 = self.down1(feat)
        feat_1 = self.transformer_half(feat_1)

        feat_2 = self.down2(feat_1)
        feat_2 = self.transformer_quarter(feat_2)

        feat_2 = self.up1(feat_2)
        feat_1 = self.fusion1(torch.cat([feat_1, feat_2], dim=1))

        feat_1 = self.up1(feat_1)
        feat = self.fusion2(torch.cat([feat_0, feat_1], dim=1))

        feat = self.transformer_full(feat)
        feat = self.restormer_extra1(feat)
        feat = self.restormer_extra2(feat)

        feat = self.freq_attn(feat)
        feat = self.channel_attn(feat)
        feat = self.spatial_attn(feat)

        out_dwt = self.tail(feat)
        out = self.iwt(out_dwt)
        return out + self.iwt(x_dwt)