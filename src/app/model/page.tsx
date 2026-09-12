"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchModelInfo } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Cpu, Layers, Activity, Cog, BrainCircuit, Combine, Aperture, Sigma, FileCode2 } from "lucide-react";

export default function ModelPage() {
  const [info, setInfo] = useState<any>(null);

  useEffect(() => {
    fetchModelInfo().then(setInfo).catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-[1400px] px-4 lg:px-8 py-8 lg:py-12 space-y-8">
      <header className="space-y-3">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Model Architecture</div>
        <h1 className="text-3xl lg:text-5xl font-semibold tracking-tight">
          <span className="vx-text-gradient">VisionX Model</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          VisionX Model Architecture. Wavelet decomposition, multi-scale Restormer-style
          transformer blocks, frequency attention, and residual learning for single-image
          deraining. Previous research baseline — HRS-Net.
        </p>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-6 gap-3 text-sm">
        <Stat label="Input Channels" value="3" icon={<Aperture className="h-3.5 w-3.5" />} />
        <Stat label="Feature Channels" value="64" icon={<Sigma className="h-3.5 w-3.5" />} />
        <Stat label="Transformer Blocks" value="12" icon={<Layers className="h-3.5 w-3.5" />} />
        <Stat label="Attention Heads" value="8" icon={<Cog className="h-3.5 w-3.5" />} />
        <Stat label="Framework" value="PyTorch" icon={<Cpu className="h-3.5 w-3.5" />} />
        <Stat label="Task" value="Single Image Deraining" icon={<BrainCircuit className="h-3.5 w-3.5" />} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <Card className="border-border/60 bg-card/30">
          <CardHeader>
            <CardTitle className="text-base">Architecture Diagram</CardTitle>
          </CardHeader>
          <CardContent>
            <ArchitectureDiagram />
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/30">
          <CardHeader>
            <CardTitle className="text-base">Weights & Repository</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <KV label="Model File" value="best_model_new.pth" />
            <KV label="Repository" value="NSG04/visionx-model" />
            <KV label="Loader" value="state_dict, strict=True" />
            <KV label="Device" value={info?.device ?? "—"} />
            <KV label="Parameters" value={info ? info.param_count.toLocaleString() : "—"} />
            <div className="pt-2">
              <Button asChild variant="outline" size="sm">
                <a href="https://huggingface.co/NSG04/visionx-model" target="_blank" rel="noreferrer">
                  View on Hugging Face <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="border-border/60 bg-card/30">
          <CardHeader>
            <CardTitle className="text-base">Architecture Components</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {(info?.components || []).map((c: string) => (
                <li key={c} className="rounded-md border border-border/60 bg-card/40 px-3 py-2">
                  {c}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="border-border/60 bg-card/30">
          <CardHeader>
            <CardTitle className="text-base">VisionX Engine — Product Architecture</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductDiagram />
          </CardContent>
        </Card>
      </section>

      <section className="rounded-lg border border-amber-400/30 bg-amber-500/5 p-4 text-sm text-amber-200/90">
        VisionX is a research-oriented image-restoration implementation. Restoration
        quality can vary depending on rain intensity, scene complexity, lighting,
        and domain shift. We do not claim state-of-the-art accuracy.
      </section>

      <div className="flex gap-2">
        <Button asChild>
          <Link href="/app">Try inference <ArrowRight className="h-4 w-4 ml-1" /></Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/docs">Read documentation</Link>
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">{icon}{label}</div>
      <div className="font-mono mt-1 text-sm">{value}</div>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/40 pb-1.5 last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

function ArchitectureDiagram() {
  return (
    <div className="space-y-2 font-mono text-xs">
      <Box label="🌧️ RAINY IMAGE" />
      <Arrow />
      <Box label="RGB TENSOR (B, 3, H, W)" />
      <Arrow />
      <Box label="DWT (custom Haar)" highlight />
      <Arrow />
      <Box label="HEAD (3×3 conv → 64)" />
      <Arrow />
      <Box label="MULTI-SCALE FEATURES" />
      <div className="pl-4 space-y-2">
        <Box label="down1 → transformer_half" />
        <Box label="down2 → transformer_quarter" />
      </div>
      <Arrow />
      <Box label="FEATURE FUSION (fusion1, fusion2)" />
      <Arrow />
      <Box label="TRANSFORMER PROCESSING" highlight />
      <div className="pl-4 space-y-2">
        <Box label="transformer_full (4 blocks)" />
        <Box label="restormer_extra1" />
        <Box label="restormer_extra2" />
      </div>
      <Arrow />
      <Box label="FREQUENCY ATTENTION (FFT)" highlight />
      <Arrow />
      <Box label="CHANNEL ATTENTION" />
      <Arrow />
      <Box label="SPATIAL ATTENTION" />
      <Arrow />
      <Box label="TAIL (3×3 → ReLU → 3×3)" />
      <Arrow />
      <Box label="IWT" highlight />
      <Arrow />
      <Box label="RESIDUAL RECONSTRUCTION" />
      <Arrow />
      <Box label="✨ DERAINED IMAGE" highlight />
    </div>
  );
}

function ProductDiagram() {
  return (
    <div className="font-mono text-xs space-y-3">
      <div className="text-center"><Box label="🌧️ RAINY IMAGE" /></div>
      <Arrow />
      <div className="text-center"><Box label="🧠 VISIONX ENGINE" highlight /></div>
      <Arrow />
      <div className="text-center"><Box label="VisionX Engine · PyTorch" highlight /></div>
      <Arrow />
      <div className="text-center"><Box label="✨ DERAINED IMAGE" highlight /></div>
      <Arrow />
      <div className="grid grid-cols-3 gap-2">
        <Box label="RESTORATION ANALYSIS" />
        <Box label="X-RAY" />
        <Box label="OBJECT ANALYSIS" />
      </div>
      <Arrow />
      <div className="grid grid-cols-2 gap-2">
        <Box label="VISION ASSISTANT" />
        <Box label="RESTORATION STRENGTH" />
      </div>
      <Arrow />
      <div className="text-center"><Box label="COMPARE / DOWNLOAD" highlight /></div>
    </div>
  );
}

function Box({ label, highlight }: { label: string; highlight?: boolean }) {
  return (
    <div
      className={`inline-block px-3 py-2 rounded-md border ${
        highlight
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border/60 bg-card/40 text-foreground/90"
      }`}
    >
      {label}
    </div>
  );
}

function Arrow() {
  return <div className="text-center text-muted-foreground/70">↓</div>;
}