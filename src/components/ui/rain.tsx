"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface RainDrop {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
  width: number;
}

interface RainProps {
  className?: string;
  dropCount?: number;
  color?: string;
  enableLightning?: boolean;
  intensity?: "light" | "medium" | "heavy";
}

export function RainBackground({
  className,
  dropCount = 36,
  color = "rgba(255,255,255,0.14)",
  enableLightning = false,
  intensity = "light",
}: RainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const dropsRef = useRef<RainDrop[]>([]);
  const sizeRef = useRef({ width: 0, height: 0, dpr: 1 });
  const reducedRef = useRef(false);
  const visibleRef = useRef(true);
  const lightningRef = useRef({ active: false, progress: 0, x: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedRef.current = mediaQuery.matches;
    const onMotion = (e: MediaQueryListEvent) => {
      reducedRef.current = e.matches;
    };
    mediaQuery.addEventListener("change", onMotion);

    const count =
      intensity === "heavy"
        ? Math.min(dropCount, 48)
        : intensity === "medium"
          ? Math.min(dropCount, 36)
          : Math.min(dropCount, 28);

    const initDrops = (w: number, h: number) => {
      dropsRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        length: 8 + Math.random() * 16,
        speed: 3.2 + Math.random() * 5,
        opacity: 0.07 + Math.random() * 0.1,
        width: 0.5 + Math.random() * 0.8,
      }));
    };

    let resizeTimer = 0;
    const resize = () => {
      const parent = canvas.parentElement;
      const rect = parent?.getBoundingClientRect();
      const cssW = Math.max(1, rect?.width || window.innerWidth);
      const cssH = Math.max(1, rect?.height || window.innerHeight);
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      const w = Math.max(1, Math.floor(cssW * dpr));
      const h = Math.max(1, Math.floor(cssH * dpr));
      if (canvas.width === w && canvas.height === h) return;
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      sizeRef.current = { width: w, height: h, dpr };
      if (dropsRef.current.length === 0) initDrops(w, h);
    };

    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 150);
    };

    resize();
    window.addEventListener("resize", onResize, { passive: true });

    const onVis = () => {
      visibleRef.current = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", onVis);

    const io = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting && document.visibilityState === "visible";
      },
      { threshold: 0 }
    );
    io.observe(canvas);

    let last = 0;
    const animate = (now: number) => {
      animationRef.current = requestAnimationFrame(animate);
      if (!visibleRef.current || reducedRef.current) return;
      if (now - last < 33) return;
      last = now;

      const ctx = canvas.getContext("2d", { alpha: true });
      if (!ctx) return;
      const { width, height, dpr } = sizeRef.current;
      if (width === 0 || height === 0) return;

      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = color;
      ctx.lineCap = "round";

      const drops = dropsRef.current;
      for (let i = 0; i < drops.length; i++) {
        const drop = drops[i];
        ctx.globalAlpha = drop.opacity;
        ctx.lineWidth = drop.width * dpr;
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x, drop.y + drop.length * dpr);
        ctx.stroke();
        drop.y += drop.speed * dpr * 0.7;
        if (drop.y > height + drop.length) {
          drop.y = -drop.length;
          drop.x = Math.random() * width;
        }
      }

      if (enableLightning && !lightningRef.current.active && Math.random() < 0.0004) {
        lightningRef.current = { active: true, progress: 0, x: Math.random() * width };
      }
      if (lightningRef.current.active) {
        lightningRef.current.progress += 0.18;
        if (lightningRef.current.progress >= 1) {
          lightningRef.current.active = false;
        } else {
          const t = Math.sin(lightningRef.current.progress * Math.PI);
          ctx.fillStyle = `rgba(255,255,255,${0.08 * t})`;
          ctx.fillRect(0, 0, width, height);
        }
      }

      ctx.globalAlpha = 1;
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", onResize);
      window.clearTimeout(resizeTimer);
      document.removeEventListener("visibilitychange", onVis);
      mediaQuery.removeEventListener("change", onMotion);
      io.disconnect();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [color, dropCount, enableLightning, intensity]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("absolute inset-0 pointer-events-none", className)}
      aria-hidden="true"
    />
  );
}

export function RainHero({ className }: { className?: string }) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      <div className="absolute inset-0 bg-black" />
      <RainBackground
        dropCount={28}
        color="rgba(255,255,255,0.12)"
        intensity="light"
        enableLightning={false}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/50 pointer-events-none" />
    </div>
  );
}
