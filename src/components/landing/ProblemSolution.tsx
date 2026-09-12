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

const STEPS = [
  {
    number: "01",
    title: "DEGRADATION",
    subtitle: "Rain causes streaks, occlusion, noise, and lost details",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    items: [
      "Directional bright streaks overlay scene content",
      "Contrast reduction across spatial frequencies",
      "Texture and edge information obscured",
      "Ill-posed inverse problem — multiple solutions",
    ],
  },
  {
    number: "02",
    title: "RECONSTRUCTION",
    subtitle: "VisionX analyzes image information across multiple scales",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/20",
    items: [
      "Custom Haar DWT decomposes into 4 sub-bands",
      "Multi-scale transformer blocks (full, half, quarter)",
      "MDTA: Multi-head transposed self-attention",
      "GDFN: Gated feedforward network processing",
      "Frequency attention via 2D FFT modulation",
      "Channel & spatial attention recalibration",
    ],
  },
  {
    number: "03",
    title: "RESTORATION",
    subtitle: "The model reconstructs a cleaner, more informative image",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    items: [
      "Feature fusion (fusion1, fusion2) merges scales",
      "Residual learning — predicts rain component",
      "IWT reconstructs full-resolution output",
      "Output = input + learned residual",
      "Preserves scene structure, removes rain artifacts",
    ],
  },
];

export function ProblemSolution() {
  return (
    <section
      id="problemsolution"
      className="relative py-24 lg:py-32 px-4 lg:px-8 scroll-mt-20"
      aria-labelledby="ps-heading"
    >

      <div className="relative z-10 mx-auto max-w-[1400px]">
        <ScrollReveal delay={100}>
          <div className="text-center mb-16 lg:mb-20">
            <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-yellow-400/90 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
              PROBLEM → SOLUTION
            </span>
            <h2
              id="ps-heading"
              className="text-4xl lg:text-6xl font-semibold tracking-tight leading-tight text-white mb-6"
            >
              From degradation
              <br />
              <span className="text-yellow-400">to reconstruction.</span>
            </h2>
            <p className="text-lg lg:text-xl text-white/60 max-w-3xl mx-auto leading-relaxed">
              A visual progression showing how VisionX transforms rain-degraded input
              into restored output through the VisionX pipeline.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <div className="space-y-8 lg:space-y-12">
            {STEPS.map((step, index) => (
              <div
                key={step.number}
                className="relative group"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
                  <div className={cn(
                    "flex-shrink-0 w-full lg:w-[180px] relative",
                    index % 2 === 1 && "lg:order-2"
                  )}>
                    <div className={cn(
                      "aspect-square lg:aspect-auto min-h-[180px] rounded-xl border p-6 lg:p-8 flex flex-col justify-center",
                      step.bgColor,
                      step.borderColor
                    )}>
                      <div className={cn("text-[10px] font-mono uppercase tracking-[0.2em] mb-2", step.color)}>
                        {step.number}
                      </div>
                      <h3 className={cn("text-2xl lg:text-3xl font-semibold tracking-tight mb-2", step.color)}>
                        {step.title}
                      </h3>
                      <p className="text-white/50 text-sm lg:text-base">{step.subtitle}</p>
                    </div>

                    <div className={cn("absolute top-1/2 -translate-y-1/2 w-1 h-full hidden lg:block", index < 2 ? step.borderColor : "transparent")} style={{ left: "50%", right: "auto" }} />
                    <div className={cn("absolute top-1/2 -translate-y-1/2 w-1 h-full hidden lg:block", index < 2 ? step.borderColor : "transparent")} style={{ right: "50%", left: "auto" }} />
                  </div>

                  <div className={cn("flex-1 space-y-3", index % 2 === 1 && "lg:order-1")}>
                    {step.items.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-4 p-4 rounded-lg border border-white/5 bg-white/5 hover:border-white/10 hover:bg-white/10 transition-all"
                      >
                        <div className={cn("flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-mono", step.color, step.bgColor, step.borderColor)}>
                          {String(i + 1).padStart(2, "0")}
                        </div>
                        <p className="text-white/80 leading-relaxed mt-0.5">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={400}>
          <div className="mt-16 lg:mt-24 text-center">
            <p className="text-white/40 font-mono text-xs tracking-wider">
              Connected visual timeline — not isolated feature cards
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}