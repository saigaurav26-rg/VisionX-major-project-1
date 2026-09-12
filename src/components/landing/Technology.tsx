"use client";

import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  threshold?: number;
  rootMargin?: string;
}

function ScrollReveal({ children, className, delay = 0, threshold = 0.1, rootMargin = "0px" }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
          observer.unobserve(entry.target);
        }
      },
      { threshold, rootMargin }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay, threshold, rootMargin, prefersReducedMotion]);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-1000 ease-out",
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-8",
        className
      )}
    >
      {children}
    </div>
  );
}

const PIPELINE_STAGES = [
  {
    label: "INPUT IMAGE",
    detail: "Rainy / Degraded",
    highlight: false,
  },
  {
    label: "DWT (Haar)",
    detail: "Wavelet Decomposition → 4 Sub-bands",
    highlight: true,
  },
  {
    label: "HEAD",
    detail: "3×3 Conv → 64 Channels",
    highlight: false,
  },
  {
    label: "MULTI-SCALE FEATURES",
    detail: "down1 → transformer_half, down2 → transformer_quarter",
    highlight: false,
  },
  {
    label: "FEATURE FUSION",
    detail: "fusion1, fusion2 — Multi-scale Merge",
    highlight: true,
  },
  {
    label: "TRANSFORMER PROCESSING",
    detail: "transformer_full (4 blocks), restormer_extra1, restormer_extra2",
    highlight: true,
  },
  {
    label: "FREQUENCY ATTENTION",
    detail: "FFT Magnitude + Phase Modulation",
    highlight: true,
  },
  {
    label: "CHANNEL ATTENTION",
    detail: "Channel Recalibration",
    highlight: false,
  },
  {
    label: "SPATIAL ATTENTION",
    detail: "Avg/Max Pool → Spatial Highlight",
    highlight: false,
  },
  {
    label: "TAIL",
    detail: "3×3 Conv → ReLU → 3×3 Conv",
    highlight: false,
  },
  {
    label: "IWT (Haar)",
    detail: "Inverse Wavelet Transform",
    highlight: true,
  },
  {
    label: "RESIDUAL RECONSTRUCTION",
    detail: "Output = Input + Learned Residual",
    highlight: false,
  },
  {
    label: "DERAINED IMAGE",
    detail: "Restored Output",
    highlight: true,
  },
];

const ARCH_COMPONENTS = [
  { name: "Wavelet Decomposition", detail: "Custom Haar DWT / IWT", implemented: true },
  { name: "Multi-Scale Feature Processing", detail: "Full / Half / Quarter Resolution Paths", implemented: true },
  { name: "Restormer-Style Transformer Blocks", detail: "MDTA + GDFN × 12 Blocks", implemented: true },
  { name: "Frequency Attention (FFT)", detail: "Magnitude Modulation + Inverse FFT", implemented: true },
  { name: "Channel Attention", detail: "SE-Style Channel Recalibration", implemented: true },
  { name: "Spatial Attention", detail: "Avg/Max Pool → Spatial Map", implemented: true },
  { name: "Feature Fusion", detail: "fusion1, fusion2 — Cross-Scale Merge", implemented: true },
  { name: "Residual Learning", detail: "Predict Rain Component, Not Full Scene", implemented: true },
  { name: "DWT-Compatible Padding", detail: "Reflection Padding for 2^n Divisibility", implemented: true },
  { name: "GPU Inference Pipeline", detail: "Asyncio Lock, Cached Model, Sequential Batch", implemented: true },
];

export function Technology() {
  return (
    <section
      id="technology"
      className="relative py-24 lg:py-32 px-4 lg:px-8 scroll-mt-20"
      aria-labelledby="tech-heading"
    >

      <div className="relative z-10 mx-auto max-w-[1400px]">
        <ScrollReveal delay={100}>
          <div className="text-center mb-16 lg:mb-20">
            <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-yellow-400/90 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
              TECHNOLOGY
            </span>
            <h2
              id="tech-heading"
              className="text-4xl lg:text-6xl font-semibold tracking-tight leading-tight text-white mb-6"
            >
              Inside
              <br />
              <span className="text-yellow-400">VisionX.</span>
            </h2>
            <p className="text-lg lg:text-xl text-white/60 max-w-3xl mx-auto leading-relaxed">
              The VisionX architecture — based on the implementation in this codebase.
              Every component shown here exists in the trained model.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <div className="relative">
            <div className="absolute inset-y-0 left-1/2 w-px bg-gradient-to-b from-transparent via-yellow-400/30 to-transparent -translate-x-1/2 hidden lg:block" />
            
            <div className="space-y-4">
              {PIPELINE_STAGES.map((stage, index) => (
                <div
                  key={stage.label}
                  className={cn(
                    "flex items-center gap-6 lg:gap-8 relative",
                    index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                  )}
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  <div className={cn(
                    "flex-shrink-0 w-full lg:w-1/2 px-4 relative z-10",
                    index % 2 === 0 ? "lg:text-right lg:pr-12" : "lg:pl-12"
                  )}>
                    <div className={cn(
                      "rounded-xl border p-4 lg:p-6 min-h-[100px] transition-all duration-500 group-hover:scale-[1.02]",
                      stage.highlight
                        ? "border-yellow-400/40 bg-yellow-500/10 bg-gradient-to-br from-yellow-500/10 to-transparent"
                        : "border-white/10 bg-white/5"
                    )}>
                      <div className={cn("text-[10px] font-mono uppercase tracking-[0.2em] mb-2", stage.highlight ? "text-yellow-400" : "text-white/50")}>
                        {stage.label}
                      </div>
                      <p className="text-white/70 text-sm font-mono">{stage.detail}</p>
                    </div>
                    
                    <div className="absolute top-1/2 -translate-y-1/2 hidden lg:block w-3 h-3 rounded-full border-2" 
                         style={{ 
                           left: index % 2 === 0 ? "calc(50% - 1.5rem)" : "calc(50% + 10.5rem)",
                           borderColor: stage.highlight ? "rgb(250, 204, 21)" : "rgba(255,255,255,0.2)",
                           backgroundColor: stage.highlight ? "rgb(250, 204, 21)" : "transparent"
                         }}
                    />
                  </div>

                  <div className={cn(
                    "flex-shrink-0 w-full lg:w-1/2 px-4 relative z-10",
                    index % 2 === 0 ? "lg:pl-12" : "lg:pr-12 lg:text-right"
                  )}>
                    <div className={cn(
                      "rounded-xl border p-4 lg:p-6 min-h-[100px] transition-all duration-500 group-hover:scale-[1.02]",
                      stage.highlight
                        ? "border-yellow-400/40 bg-yellow-500/10 bg-gradient-to-br from-yellow-500/10 to-transparent"
                        : "border-white/10 bg-white/5"
                    )}>
                      <div className={cn("text-[10px] font-mono uppercase tracking-[0.2em] mb-2", stage.highlight ? "text-yellow-400" : "text-white/50")}>
                        {index < PIPELINE_STAGES.length - 1 ? "↓" : "✓"}
                      </div>
                      <p className="text-white/70 text-sm font-mono">
                        {index < PIPELINE_STAGES.length - 1 ? PIPELINE_STAGES[index + 1].detail : "Pipeline Complete"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={400}>
          <div className="mt-20 lg:mt-28">
            <h3 className="text-2xl lg:text-3xl font-semibold tracking-tight text-white mb-8 text-center">
              Implemented Architecture Components
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ARCH_COMPONENTS.map((comp, index) => (
                <div
                  key={comp.name}
                  className={cn(
                    "rounded-xl border p-5 transition-all duration-300 hover:border-yellow-400/50 hover:bg-yellow-400/5",
                    comp.implemented ? "border-white/10 bg-white/5" : "border-white/5 bg-white/2"
                  )}
                  style={{ transitionDelay: `${index * 30}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center", comp.implemented ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-white/40")}>
                      {comp.implemented ? (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="15" y1="9" x2="9" y2="15" />
                          <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium text-sm">{comp.name}</h4>
                      <p className="text-white/50 text-xs font-mono mt-1">{comp.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={500}>
          <div className="mt-16 lg:mt-24 rounded-xl border border-yellow-400/20 bg-yellow-500/5 p-6 lg:p-8 text-center">
            <p className="text-white/70 font-mono text-sm max-w-2xl mx-auto">
              VisionX Engine — 12 transformer blocks, 8 attention heads,
              64 feature channels. Custom Haar DWT/IWT. PyTorch implementation with real inference.
            </p>
            <p className="mt-4 text-xs text-white/40 font-mono">
              Previous research baseline — HRS-Net. Based on actual model components from this codebase.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}