"use client";

import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, ScanSearch, Box, Zap, ChevronRight } from "lucide-react";

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

const XRAY_VIEWS = [
  {
    id: "original",
    label: "ORIGINAL",
    subtitle: "Rain-Degraded Input",
    icon: Sparkles,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    description: "Original rainy image with streaks and occlusion",
  },
  {
    id: "rain-map",
    label: "RAIN MAP",
    subtitle: "Estimated Rain Distribution",
    icon: Zap,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/20",
    description: "Computed rain density from residual analysis",
  },
  {
    id: "detail",
    label: "DETAIL",
    subtitle: "High-Frequency Recovery",
    icon: ScanSearch,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    description: "Restored fine details and texture information",
  },
  {
    id: "edge",
    label: "EDGE",
    subtitle: "Structural Edge Map",
    icon: Box,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
    description: "Recovered structural edges and boundaries",
  },
  {
    id: "restored",
    label: "RESTORED",
    subtitle: "VisionX Output",
    icon: Sparkles,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    description: "Final derained result with recovered details",
  },
];

function XRayCard({ view, isActive, onClick }: { view: typeof XRAY_VIEWS[0]; isActive: boolean; onClick: () => void }) {
  const Icon = view.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative group flex flex-col items-center p-6 text-center transition-all duration-300 rounded-xl",
        isActive
          ? "border-yellow-400/50 bg-yellow-500/5 ring-2 ring-yellow-400/20"
          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
      )}
    >
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300", view.bgColor, view.borderColor)}>
        <Icon className={cn("h-6 w-6", view.color)} strokeWidth={1.5} />
      </div>
      <div className={cn("text-[10px] font-mono uppercase tracking-[0.2em] mb-1", isActive ? "text-yellow-400" : view.color)}>
        {view.label}
      </div>
      <p className="text-white/50 text-xs font-mono mb-2">{view.subtitle}</p>
      <p className="text-white/40 text-[11px] max-w-[140px] leading-relaxed">{view.description}</p>
      
      {isActive && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-yellow-400" />
      )}
      
      <div className={cn(
        "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity",
        isActive ? "opacity-100" : ""
      )}>
        <div className="absolute inset-0 bg-gradient-to-t from-yellow-400/10 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 flex justify-center">
          <span className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 rounded">
            ACTIVE VIEW
          </span>
        </div>
      </div>
    </button>
  );
}

function PipelineStep({ label, detail, color, delay }: { label: string; detail: string; color: string; delay: number }) {
  return (
    <div
      className="flex items-center gap-4"
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-mono font-semibold flex-shrink-0", color, `${color.replace("text-", "bg-")}/20`, `${color.replace("text-", "border-")}/30`)}>
        ↓
      </div>
      <div className="min-w-0">
        <p className="text-white font-medium text-sm">{label}</p>
        <p className="text-white/50 text-xs font-mono">{detail}</p>
      </div>
    </div>
  );
}

export function RestorationXRayPreview() {
  const [activeView, setActiveView] = useState(0);

  return (
    <section
      id="xray"
      className="relative py-24 lg:py-32 px-4 lg:px-8 scroll-mt-20"
      aria-labelledby="xray-heading"
    >

      <div className="relative z-10 mx-auto max-w-[1400px]">
        <ScrollReveal delay={100}>
          <div className="text-center mb-16 lg:mb-20">
            <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-yellow-400/90 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
              RESTORATION X-RAY
            </span>
            <h2
              id="xray-heading"
              className="text-4xl lg:text-6xl font-semibold tracking-tight leading-tight text-white mb-6"
            >
              Look beyond
              <br />
              <span className="text-yellow-400">the restoration.</span>
            </h2>
            <p className="text-lg lg:text-xl text-white/60 max-w-3xl mx-auto leading-relaxed">
              VisionX Analysis provides multiple analytical views of the restoration process.
              Each view reveals different aspects of what the model recovers.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-16 lg:mb-20">
            {XRAY_VIEWS.map((view, index) => (
              <XRayCard
                key={view.id}
                view={view}
                isActive={activeView === index}
                onClick={() => setActiveView(index)}
              />
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={300}>
          <div className="relative mb-16 lg:mb-20">
            <div className="aspect-video max-w-4xl mx-auto rounded-xl border border-white/10 bg-black/50 overflow-hidden relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="text-4xl font-mono text-yellow-400/30 mb-4">X-Ray Preview</div>
                  <div className="text-white/40 font-mono text-sm tracking-wider mb-6">
                    {XRAY_VIEWS[activeView].label} VIEW
                  </div>
                  <div className="flex items-center justify-center gap-4 text-xs text-white/50 font-mono">
                    <span>← Select a view above</span>
                    <span className="w-px h-4 bg-white/10" />
                    <span>{XRAY_VIEWS[activeView].description}</span>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
            </div>

            <div className="mt-6 text-center">
              <p className="text-[11px] text-white/40 font-mono">
                Interactive preview — connect to real VisionX Engine for live analysis
              </p>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={400}>
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl lg:text-3xl font-semibold tracking-tight text-white mb-8 text-center">
              Analysis Pipeline
            </h3>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-4 flex-wrap">
              <PipelineStep
                label="ORIGINAL"
                detail="Rain-degraded capture"
                color="text-red-400"
                delay={0}
              />
              <PipelineStep
                label="VISIONX ENGINE"
                detail="VisionX inference + analysis"
                color="text-yellow-400"
                delay={100}
              />
              <PipelineStep
                label="RESTORATION"
                detail="Residual, detail, edge maps"
                color="text-emerald-400"
                delay={200}
              />
              <PipelineStep
                label="X-RAY VIEWS"
                detail="Multi-perspective analysis"
                color="text-cyan-400"
                delay={300}
              />
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={500}>
          <div className="mt-16 lg:mt-24 text-center">
            <Button asChild size="lg" className="w-full sm:w-auto group">
              <a href="/app">
                Open VisionX Engine
                <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
              </a>
            </Button>
            <p className="mt-4 text-xs text-white/40 font-mono">
              Access full Restoration, X-Ray, Objects, Assistant & Strength analysis
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}