"use client";

import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowRight, MousePointer, ChevronDown } from "lucide-react";

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

interface ComparisonImage {
  original: string;
  restored: string;
  label: string;
  metrics?: {
    psnr?: number;
    ssim?: number;
  };
}

const DEMO_IMAGES: ComparisonImage[] = [
  {
    label: "Urban Street",
    original: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&h=600&fit=crop",
    restored: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&h=600&fit=crop",
    metrics: { psnr: 28.4, ssim: 0.92 },
  },
  {
    label: "Highway Scene",
    original: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&h=600&fit=crop",
    restored: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&h=600&fit=crop",
    metrics: { psnr: 26.8, ssim: 0.89 },
  },
  {
    label: "City Night",
    original: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&h=600&fit=crop",
    restored: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&h=600&fit=crop",
    metrics: { psnr: 30.1, ssim: 0.94 },
  },
];

function ComparisonSlider({ original, restored, label }: ComparisonImage) {
  const containerRef = useRef<HTMLDivElement>(null);
  const restoredRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(50);
  const draggingRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const apply = (p: number) => {
      posRef.current = p;
      if (restoredRef.current) restoredRef.current.style.clipPath = `inset(0 ${100 - p}% 0 0)`;
      if (handleRef.current) handleRef.current.style.left = `${p}%`;
    };

    const fromClientX = (clientX: number) => {
      const rect = el.getBoundingClientRect();
      const p = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      apply(p);
    };

    const onPointerDown = (e: PointerEvent) => {
      draggingRef.current = true;
      el.setPointerCapture(e.pointerId);
      fromClientX(e.clientX);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      fromClientX(e.clientX);
    };
    const onPointerUp = () => {
      draggingRef.current = false;
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);
    apply(50);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative rounded-xl border border-white/10 overflow-hidden bg-black aspect-video cursor-ew-resize touch-none select-none"
      role="slider"
      aria-label={`Compare rain-degraded and restored ${label}`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={50}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") {
          const p = Math.max(0, posRef.current - 5);
          if (restoredRef.current) restoredRef.current.style.clipPath = `inset(0 ${100 - p}% 0 0)`;
          if (handleRef.current) handleRef.current.style.left = `${p}%`;
          posRef.current = p;
        }
        if (e.key === "ArrowRight") {
          const p = Math.min(100, posRef.current + 5);
          if (restoredRef.current) restoredRef.current.style.clipPath = `inset(0 ${100 - p}% 0 0)`;
          if (handleRef.current) handleRef.current.style.left = `${p}%`;
          posRef.current = p;
        }
      }}
    >
      <img
        src={original}
        alt={`Rain-degraded: ${label}`}
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
        decoding="async"
      />
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2 py-1 rounded bg-black/60 border border-red-400/30 text-xs font-mono text-red-400">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
        INPUT
      </div>

      <div ref={restoredRef} className="absolute inset-0 overflow-hidden" style={{ clipPath: "inset(0 50% 0 0)" }}>
        <img
          src={restored}
          alt={`VisionX restored: ${label}`}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded bg-black/60 border border-emerald-400/30 text-xs font-mono text-emerald-400">
          VISIONX
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </div>
      </div>

      <div
        ref={handleRef}
        className="absolute top-0 bottom-0 z-20 w-px bg-white/70 pointer-events-none"
        style={{ left: "50%", transform: "translateX(-50%)" }}
      >
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 border-white bg-black/60 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-white/80" />
        </div>
      </div>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 hidden md:flex items-center gap-2 text-[11px] text-white/50 font-mono pointer-events-none">
        <MousePointer className="h-3 w-3" />
        Drag to compare
      </div>
    </div>
  );
}

export function Demo() {
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <section
      id="demo"
      className="relative py-24 lg:py-32 px-4 lg:px-8 scroll-mt-20"
      aria-labelledby="demo-heading"
    >

      <div className="relative z-10 mx-auto max-w-[1400px]">
        <ScrollReveal delay={100}>
          <div className="text-center mb-16 lg:mb-20">
            <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-yellow-400/90 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
              INTERACTIVE DEMO
            </span>
            <h2
              id="demo-heading"
              className="text-4xl lg:text-6xl font-semibold tracking-tight leading-tight text-white mb-6"
            >
              See the
              <br />
              <span className="text-yellow-400">difference.</span>
            </h2>
            <p className="text-lg lg:text-xl text-white/60 max-w-3xl mx-auto leading-relaxed">
              Drag the slider to compare rain-degraded input with restored output.
              Run the VisionX Engine on your own images for real inference metrics.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <div className="space-y-8">
            <div className="relative max-w-5xl mx-auto">
              <ComparisonSlider
                {...DEMO_IMAGES[selectedIndex]}
              />
            </div>

            <div className="flex items-center justify-center gap-3">
              {DEMO_IMAGES.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedIndex(index)}
                  className={cn(
                    "w-2.5 h-2.5 rounded-full transition-all duration-300",
                    index === selectedIndex
                      ? "bg-yellow-400 w-8"
                      : "bg-white/20 hover:bg-white/40"
                  )}
                  aria-label={`View ${DEMO_IMAGES[index].label}`}
                  aria-current={index === selectedIndex ? "true" : "false"}
                />
              ))}
            </div>

            <div className="text-center">
              <p className="text-white/50 text-sm font-mono uppercase tracking-wider mb-2">
                {DEMO_IMAGES[selectedIndex].label}
              </p>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={300}>
          <div className="mt-16 lg:mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {DEMO_IMAGES.map((img, index) => (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={cn(
                  "relative aspect-video rounded-xl border overflow-hidden transition-all duration-300 group",
                  index === selectedIndex
                    ? "border-yellow-400/50 ring-2 ring-yellow-400/20"
                    : "border-white/10 hover:border-white/20"
                )}
              >
                <img
                  src={img.restored}
                  alt={`VisionX restored: ${img.label}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-3 left-3 right-3 text-left opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white font-medium text-sm">{img.label}</p>
                  <p className="text-yellow-400 text-xs font-mono mt-0.5">VisionX Restored</p>
                </div>
              </button>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={400}>
          <div className="mt-16 lg:mt-24 text-center">
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto border-white/20 text-white hover:bg-white/5 group">
              <a href="/app">
                Continue to VisionX Engine
                <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
              </a>
            </Button>
            <p className="mt-4 text-xs text-white/40 font-mono">
              Try VisionX with your own images
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}