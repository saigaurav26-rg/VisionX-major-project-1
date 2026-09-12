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

const TECH_TAGS = [
  "IMAGE RESTORATION",
  "DEEP LEARNING",
  "COMPUTER VISION",
  "MULTI-SCALE FEATURES",
  "WAVELET DECOMPOSITION",
  "TRANSFORMER ARCHITECTURE",
  "FREQUENCY ATTENTION",
  "RESIDUAL LEARNING",
];

export function About() {
  return (
    <section
      id="about"
      className="relative py-24 lg:py-32 px-4 lg:px-8 scroll-mt-20"
      aria-labelledby="about-heading"
    >

      <div className="relative z-10 mx-auto max-w-[1400px]">
        <ScrollReveal delay={100}>
          <div className="text-center mb-16 lg:mb-20">
            <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-yellow-400/90 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
              ABOUT VISIONX
            </span>
            <h2
              id="about-heading"
              className="text-4xl lg:text-6xl font-semibold tracking-tight leading-tight text-white mb-6"
            >
              Restoration is more than
              <br />
              <span className="text-yellow-400">removing rain.</span>
            </h2>
            <p className="text-lg lg:text-xl text-white/60 max-w-3xl mx-auto leading-relaxed">
              VisionX focuses on recovering structures, textures, details, and visual information
              that rain degradation obscures. Not just pixel cleanup — true restoration.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-2xl lg:text-3xl font-medium tracking-tight text-white">
                  VisionX recovers what rain takes away.
                </h3>
                <p className="text-white/70 leading-relaxed text-lg">
                  Rain introduces directional streaks, reduces contrast, and obscures scene content.
                  The same streak may be visible in some pixels and indistinguishable from scene structure
                  in others, making deraining an ill-posed inverse problem.
                </p>
                <p className="text-white/70 leading-relaxed text-lg">
                  VisionX addresses this through wavelet-domain processing combined with multi-scale
                  transformer blocks. The custom Haar DWT splits an image into four sub-bands; the
                  IWT reconstructs. Multi-scale paths feed transformer blocks at progressively smaller
                  resolutions, enabling the network to handle different frequency components in parallel.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {TECH_TAGS.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-white/10 bg-white/5 text-white/70 hover:text-white hover:border-yellow-400/50 hover:bg-yellow-400/10 transition-all"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="aspect-[4/3] rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-black/50 overflow-hidden relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="text-6xl font-mono text-yellow-400/30 mb-4">VISIONX</div>
                    <div className="text-white/40 font-mono text-sm tracking-wider">
                      VisionX Restoration Engine<br />
                      <span className="text-white/30">Previous research baseline — HRS-Net</span>
                    </div>
                    <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                      <div className="border-t border-white/10 pt-4">
                        <div className="text-2xl font-semibold text-white">12</div>
                        <div className="text-xs text-white/50">Transformer Blocks</div>
                      </div>
                      <div className="border-t border-white/10 pt-4">
                        <div className="text-2xl font-semibold text-white">8</div>
                        <div className="text-xs text-white/50">Attention Heads</div>
                      </div>
                      <div className="border-t border-white/10 pt-4">
                        <div className="text-2xl font-semibold text-white">64</div>
                        <div className="text-xs text-white/50">Feature Channels</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}