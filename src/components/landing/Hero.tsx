"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RainHero } from "@/components/ui/rain";
import { ArrowRight, ChevronDown, Sparkles } from "lucide-react";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  threshold?: number;
}

function ScrollReveal({ children, className, delay = 0, threshold = 0.1 }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      setIsVisible(true);
      return;
    }
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          window.setTimeout(() => setIsVisible(true), delay);
          observer.unobserve(entry.target);
        }
      },
      { threshold }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [delay, threshold]);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-[opacity,transform] duration-700 ease-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-[100svh] flex items-center justify-center overflow-hidden pt-16"
    >
      <RainHero />

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-4 lg:px-8 py-16 lg:py-24">
        <div className="text-center">
          <ScrollReveal delay={40}>
            <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-yellow-400/90 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
              AI-POWERED IMAGE RESTORATION
            </span>
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <h1 className="text-5xl lg:text-7xl xl:text-8xl font-semibold tracking-tight leading-[1.05] text-white mb-8">
              Recover the details
              <br />
              <span className="block text-yellow-400">hidden by the rain.</span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={120}>
            <p className="text-lg lg:text-xl text-white/70 max-w-3xl mx-auto leading-relaxed mb-12">
              VisionX is a deep-learning image restoration framework designed to recover visual
              information from degraded and rain-affected images.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={160}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="group w-full sm:w-auto">
                <Link href="/dashboard">
                  Continue to VisionX
                  <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-white/20 text-white hover:bg-white/5 group"
              >
                <a href="#technology">
                  Explore Technology
                  <ChevronDown className="h-4 w-4 ml-2 transition-transform group-hover:translate-y-1" />
                </a>
              </Button>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="mt-16 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs text-white/40 font-mono">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-yellow-400" />
                VisionX Architecture
              </div>
              <div className="hidden sm:block w-px h-4 bg-white/10" />
              <div className="flex items-center gap-1.5">
                <span>PyTorch Inference</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-white/10" />
              <div className="flex items-center gap-1.5">
                <span>Real-time Analysis</span>
              </div>
            </div>
          </ScrollReveal>
        </div>

        <ScrollReveal delay={240} threshold={0.2}>
          <HeroVisualStory />
        </ScrollReveal>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2" aria-hidden="true">
        <ChevronDown className="h-5 w-5 text-white/30" />
      </div>
    </section>
  );
}

function HeroVisualStory() {
  return (
    <div className="relative mt-16 lg:mt-24">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <VisualColumn
          label="INPUT"
          subtitle="Rain-Degraded Image"
          color="text-red-400/80"
          bgColor="bg-red-500/10"
          borderColor="border-red-500/20"
        >
          <div className="aspect-[4/3] rounded-lg bg-gradient-to-br from-red-500/20 to-red-900/10 border border-red-500/20 flex items-center justify-center relative overflow-hidden">
            <CssRainOverlay />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <svg className="h-12 w-12 text-red-400/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 18a5 5 0 0 0-10 0" />
                <path d="M12 2v7" />
                <path d="M9 9h6" />
                <path d="M22 22H2" />
                <path d="M16 14v4" />
                <path d="M8 14v4" />
              </svg>
            </div>
          </div>
        </VisualColumn>

        <VisualColumn
          label="VISIONX"
          subtitle="VisionX Processing"
          color="text-yellow-400"
          bgColor="bg-yellow-500/10"
          borderColor="border-yellow-500/20"
        >
          <div className="aspect-[4/3] rounded-lg bg-gradient-to-br from-yellow-500/15 to-yellow-900/5 border border-yellow-500/20 flex items-center justify-center relative overflow-hidden">
            <div className="relative flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-yellow-400" />
                <span className="h-2 w-2 rounded-full bg-yellow-400/70" />
                <span className="h-2 w-2 rounded-full bg-yellow-400/40" />
                <span className="h-2 w-2 rounded-full bg-yellow-400/20" />
              </div>
              <div className="text-center">
                <div className="text-xs font-mono text-yellow-400/80 mb-1">PROCESSING</div>
                <div className="text-2xl font-semibold text-yellow-400 font-mono">VISIONX</div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[10px] text-white/50 font-mono">
                <div>DWT</div>
                <div>MDTA</div>
                <div>IWT</div>
              </div>
            </div>
          </div>
        </VisualColumn>

        <VisualColumn
          label="RESTORED"
          subtitle="Derained Output"
          color="text-emerald-400"
          bgColor="bg-emerald-500/10"
          borderColor="border-emerald-500/20"
        >
          <div className="aspect-[4/3] rounded-lg bg-gradient-to-br from-emerald-500/15 to-emerald-900/5 border border-emerald-500/20 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <svg className="h-12 w-12 text-emerald-400/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="absolute bottom-3 left-3 right-3 text-center">
              <div className="text-[10px] font-mono text-emerald-400/80 tracking-wider">PSNR / SSIM</div>
              <div className="text-sm font-mono text-emerald-400">— / —</div>
            </div>
          </div>
        </VisualColumn>
      </div>

      <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-white/40 font-mono">
        <span>Pipeline visualization — actual metrics computed post-inference</span>
      </div>
    </div>
  );
}

function VisualColumn({
  label,
  subtitle,
  color,
  bgColor,
  borderColor,
  children,
}: {
  label: string;
  subtitle: string;
  color: string;
  bgColor: string;
  borderColor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative">
      <div className={cn("text-center mb-3", color)}>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] mb-1">{label}</div>
        <div className="text-xs text-white/50">{subtitle}</div>
      </div>
      <div className={cn("relative rounded-xl border overflow-hidden", bgColor, borderColor)}>
        {children}
      </div>
    </div>
  );
}

function CssRainOverlay() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(105deg, transparent 0 10px, rgba(255,255,255,0.08) 10px 11px)",
          backgroundSize: "22px 28px",
        }}
      />
    </div>
  );
}
