"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Code2, Cpu, Brain, GitBranch, AlertTriangle, Layers, Eye } from "lucide-react";

const SECTIONS: { title: string; tag: "hrs" | "vx" | "cv"; body: React.ReactNode }[] = [
  {
    title: "1. What is image deraining?",
    tag: "cv",
    body: (
      <p>
        Image deraining is the task of removing rain streaks and rain-induced
        visual degradation from a single image. Rain introduces directional
        bright streaks, reduces contrast, and obscures scene content.
      </p>
    ),
  },
  {
    title: "2. Why rain removal is difficult",
    tag: "cv",
    body: (
      <p>
        Rain streaks vary in direction, density, scale, and intensity. They blend
        with edges and textures. The same streak may be visible in some pixels and
        indistinguishable from scene structure in others, making deraining an
        ill-posed inverse problem.
      </p>
    ),
  },
  {
    title: "3. VisionX architecture",
    tag: "hrs",
    body: (
      <>
        <p>
          VisionX combines wavelet-domain processing with multi-scale transformer
          blocks. The custom Haar DWT splits an image into four sub-bands; the
          IWT reconstructs. Multi-scale paths feed transformer blocks at
          progressively smaller resolutions.
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Wavelet Decomposition (DWT/IWT)</li>
          <li>Multi-scale Feature Processing</li>
          <li>Restormer-style Transformer Blocks (MDTA + GDFN)</li>
          <li>Frequency Attention (FFT magnitude + phase)</li>
          <li>Channel & Spatial Attention</li>
          <li>Feature Fusion (fusion1, fusion2)</li>
          <li>Residual Reconstruction</li>
        </ul>
      </>
    ),
  },
  {
    title: "4. Wavelet processing",
    tag: "hrs",
    body: (
      <p>
        The custom Haar DWT decomposes each 2×2 block into four sub-bands. This
        separates low-frequency content from high-frequency details, allowing the
        network to handle different frequency components in parallel.
      </p>
    ),
  },
  {
    title: "5. Transformer processing",
    tag: "hrs",
    body: (
      <p>
        Restormer-style MDTA performs channel-wise multi-head transposed
        self-attention across spatial dimensions. GDFN provides gated
        feedforward processing. Together they capture both local and global
        context.
      </p>
    ),
  },
  {
    title: "6. Frequency attention",
    tag: "hrs",
    body: (
      <p>
        The FrequencyAttention module computes a 2D FFT, modulates the magnitude
        with a learned channel attention, and reconstructs the spatial signal
        via inverse FFT — emphasizing informative frequencies.
      </p>
    ),
  },
  {
    title: "7. Channel & spatial attention",
    tag: "hrs",
    body: (
      <p>
        ChannelAttention recalibrates feature channels; SpatialAttention uses
        average and max pooling along the channel axis to highlight informative
        spatial regions.
      </p>
    ),
  },
  {
    title: "8. Residual learning",
    tag: "hrs",
    body: (
      <p>
        VisionX reconstructs the derained image as a residual added to the
        inverse-DWT of the input. This stabilizes training and helps the network
        learn only the rain component rather than re-predicting the entire scene.
      </p>
    ),
  },
  {
    title: "9. VisionX Engine",
    tag: "vx",
    body: (
      <p>
        VisionX is the product layer around the restoration engine. It uploads images, runs
        real inference, persists results, and exposes five analysis tools.
      </p>
    ),
  },
  {
    title: "10. Restoration Analysis",
    tag: "vx",
    body: (
      <p>
        Computes pixel-level metrics (mean absolute difference, edge density,
        changed-pixel ratio) and produces residual and detail maps derived from
        the real VisionX output.
      </p>
    ),
  },
  {
    title: "11. X-Ray visualization",
    tag: "vx",
    body: (
      <p>
        Provides Detail, Edge, and Residual visualizations. These are analytical
        maps of the VisionX output, not internal feature activations.
      </p>
    ),
  },
  {
    title: "12. Object Analysis",
    tag: "vx",
    body: (
      <p>
        Performs indicative region-level contrast and luminance comparison
        between original and derained images. Not a general object detector.
      </p>
    ),
  },
  {
    title: "13. Vision Assistant",
    tag: "vx",
    body: (
      <p>
        A deterministic, pixel-derived Q&amp;A interface. It distinguishes factual
        image observations from any model interpretation and never fabricates
        unsupported claims.
      </p>
    ),
  },
  {
    title: "14. Restoration Strength",
    tag: "vx",
    body: (
      <p>
        Post-processing blend: <span className="font-mono">output = (1 − α)·original + α·derained</span>.
        α = 0 → original; α = 1 → full VisionX restoration. Does not modify the
        trained network.
      </p>
    ),
  },
  {
    title: "15. Inference pipeline",
    tag: "vx",
    body: (
      <p>
        Image → validation → DWT-compatible padding → ToTensor → cached VisionX Engine →
        clamp → crop/resize to original dimensions → PNG. Inference is sequential
        with an asyncio lock to avoid GPU contention.
      </p>
    ),
  },
  {
    title: "16. Model limitations",
    tag: "cv",
    body: (
      <p>
        VisionX is research-oriented. Restoration quality can vary with rain
        intensity, scene complexity, lighting, resolution, and domain shift.
        Analytical visualizations are indicative rather than ground truth.
      </p>
    ),
  },
  {
    title: "17. Responsible interpretation",
    tag: "cv",
    body: (
      <p>
        Do not present VisionX output as ground-truth rain segmentation or
        perfect restoration. Treat numerical analytics as observational signals
        derived from the VisionX output.
      </p>
    ),
  },
];

const TAG_LABEL = {
  hrs: { text: "Implemented in VisionX Engine", color: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30" },
  vx: { text: "VisionX Analysis Feature", color: "bg-cyan-500/15 text-cyan-300 border-cyan-400/30" },
  cv: { text: "Computer Vision Background", color: "bg-violet-500/15 text-violet-300 border-violet-400/30" },
} as const;

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 lg:px-8 py-8 lg:py-12 space-y-8">
      <header className="space-y-3">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Documentation</div>
        <h1 id="about" className="text-3xl lg:text-5xl font-semibold tracking-tight">VISIONX Documentation</h1>
        <p className="text-muted-foreground max-w-2xl">
          Conceptual documentation for the VisionX product and engine.
          Distinguishes what is implemented in the restoration network from what
          is part of the VisionX analysis layer. Previous research baseline — HRS-Net.
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          {Object.entries(TAG_LABEL).map(([k, v]) => (
            <span key={k} className={`px-2 py-1 rounded-md border ${v.color}`}>{v.text}</span>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {SECTIONS.map((s, i) => (
          <Card key={s.title} className="border-border/60 bg-card/30">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm">{s.title}</CardTitle>
                <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${TAG_LABEL[s.tag].color}`}>
                  {TAG_LABEL[s.tag].text}
                </span>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-foreground/85 leading-relaxed">
              {s.body}
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="rounded-xl border border-border/60 bg-card/30 p-6 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <AlertTriangle className="h-4 w-4 text-amber-300" /> Model Limitations
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          VisionX is a research-oriented image-restoration implementation.
          Restoration quality can vary depending on rain intensity, rain
          structure, scene complexity, lighting, image resolution, camera
          characteristics, and domain shift. Do not claim perfect restoration or
          removal of arbitrary weather artifacts unless supported by evidence.
          VisionX analytical tools provide indicative, not ground-truth,
          information.
        </p>
      </section>
    </div>
  );
}