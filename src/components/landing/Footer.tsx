"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CloudRain, ArrowRight, GitBranch, ExternalLink, BookOpen, Cpu, Sparkles } from "lucide-react";

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

export function Footer() {
  return (
    <footer className="relative py-16 lg:py-24 px-4 lg:px-8 border-t border-white/10">

      <div className="relative z-10 mx-auto max-w-[1400px]">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 lg:gap-12 mb-16 lg:mb-20">
          <ScrollReveal delay={100}>
            <div className="space-y-6">
              <Link href="/" className="flex items-center gap-2.5 group" aria-label="VisionX Home">
                <div className="relative h-10 w-10 rounded-md bg-gradient-to-br from-yellow-500/90 to-yellow-600/60 flex items-center justify-center ring-1 ring-yellow-400/30">
                  <CloudRain className="h-5.5 w-5.5 text-black" strokeWidth={2.5} />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-2xl font-semibold tracking-tight text-white">VISIONX</span>
                  <span className="text-[10px] text-white/40 tracking-wider uppercase">Image Restoration Engine</span>
                </div>
              </Link>
              <p className="text-white/50 text-sm leading-relaxed max-w-xs">
                Hybrid Deep Learning Framework for Image Restoration.
                Recovering visual information from degraded imagery.
              </p>
              <div className="flex items-center gap-2 text-xs text-white/40 font-mono">
                <GitBranch className="h-3 w-3" />
                <a href="https://huggingface.co/NSG04/visionx-model" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-white/70 transition-colors">
                  NSG04/visionx-model
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div>
              <h4 className="text-white font-medium text-sm uppercase tracking-wider mb-4">Navigation</h4>
              <nav className="space-y-3">
                <Link href="#about" className="block text-white/60 hover:text-white transition-colors text-sm">About</Link>
                <Link href="#technology" className="block text-white/60 hover:text-white transition-colors text-sm">Technology</Link>
                <Link href="#demo" className="block text-white/60 hover:text-white transition-colors text-sm">Demo</Link>
                <Link href="/applications" className="block text-white/60 hover:text-white transition-colors text-sm">Applications</Link>
                <Link href="#xray" className="block text-white/60 hover:text-white transition-colors text-sm">Restoration X-Ray</Link>
                <Link href="/app" className="block text-yellow-400 hover:text-yellow-300 transition-colors text-sm font-medium flex items-center gap-1.5">
                  Continue to VisionX
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </nav>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <div>
              <h4 className="text-white font-medium text-sm uppercase tracking-wider mb-4">VisionX Engine</h4>
              <nav className="space-y-3">
                <Link href="/app" className="block text-white/60 hover:text-white transition-colors text-sm flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-yellow-400" /> VisionX Engine
                </Link>
                <Link href="/model" className="block text-white/60 hover:text-white transition-colors text-sm flex items-center gap-2">
                  <Cpu className="h-3.5 w-3.5 text-cyan-400" /> Model Architecture
                </Link>
                <Link href="/history" className="block text-white/60 hover:text-white transition-colors text-sm flex items-center gap-2">
                  <BookOpen className="h-3.5 w-3.5 text-emerald-400" /> Inference History
                </Link>
                <Link href="/docs" className="block text-white/60 hover:text-white transition-colors text-sm flex items-center gap-2">
                  <GitBranch className="h-3.5 w-3.5 text-violet-400" /> Documentation
                </Link>
              </nav>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={400}>
            <div>
              <h4 className="text-white font-medium text-sm uppercase tracking-wider mb-4">Technical</h4>
              <div className="space-y-2">
                <span className="inline-block px-2 py-1 text-[10px] font-mono uppercase tracking-wider border border-white/10 bg-white/5 text-white/60">COMPUTER VISION</span>
                <span className="inline-block px-2 py-1 text-[10px] font-mono uppercase tracking-wider border border-white/10 bg-white/5 text-white/60">DEEP LEARNING</span>
                <span className="inline-block px-2 py-1 text-[10px] font-mono uppercase tracking-wider border border-white/10 bg-white/5 text-white/60">IMAGE RESTORATION</span>
                <span className="inline-block px-2 py-1 text-[10px] font-mono uppercase tracking-wider border border-white/10 bg-white/5 text-white/60">WAVELET TRANSFORMS</span>
                <span className="inline-block px-2 py-1 text-[10px] font-mono uppercase tracking-wider border border-white/10 bg-white/5 text-white/60">TRANSFORMER ARCHITECTURE</span>
                <span className="inline-block px-2 py-1 text-[10px] font-mono uppercase tracking-wider border border-white/10 bg-white/5 text-white/60">FREQUENCY ATTENTION</span>
              </div>
            </div>
          </ScrollReveal>
        </div>

        <div className="pt-8 lg:pt-12 border-t border-white/10">
          <ScrollReveal delay={500}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/40">
              <p>© 2026 VisionX. Image restoration engine for rain-degraded vision.</p>
              <p className="mt-1 text-white/60">
                  Developed by <span className="text-white font-medium"> N.SAI GAURAV, BHASKAR SAHU (CPP104)</span></p>
              <div className="flex items-center gap-4">
                <a href="https://huggingface.co/NSG04/visionx-model" target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  Model Weights
                </a>
                <a href="/docs" className="hover:text-white transition-colors">Documentation</a>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </footer>
  );
}