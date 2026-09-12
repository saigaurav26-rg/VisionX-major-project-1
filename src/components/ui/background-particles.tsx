"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  color: string;
}

interface BackgroundParticlesProps {
  className?: string;
  particleCount?: number;
  colors?: string[];
  speed?: number;
  connectDistance?: number;
  enableConnections?: boolean;
}

const DEFAULT_COLORS = [
  "rgba(255,255,255,0.10)",
  "rgba(234,179,8,0.10)",
  "rgba(34,211,238,0.07)",
];

export function BackgroundParticles({
  className,
  particleCount = 18,
  colors = DEFAULT_COLORS,
  speed = 0.12,
  connectDistance = 120,
  enableConnections = false,
}: BackgroundParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const sizeRef = useRef({ width: 0, height: 0, cssW: 0, cssH: 0, dpr: 1 });
  const reducedRef = useRef(false);
  const visibleRef = useRef(true);
  const colorsRef = useRef(colors);
  const countRef = useRef(particleCount);
  const speedRef = useRef(speed);
  const connectRef = useRef(connectDistance);
  const enableConnRef = useRef(enableConnections);
  colorsRef.current = colors;
  countRef.current = particleCount;
  speedRef.current = speed;
  connectRef.current = connectDistance;
  enableConnRef.current = enableConnections;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedRef.current = mediaQuery.matches;
    const onMotion = (e: MediaQueryListEvent) => {
      reducedRef.current = e.matches;
    };
    mediaQuery.addEventListener("change", onMotion);

    const initParticles = (w: number, h: number) => {
      const palette = colorsRef.current.length ? colorsRef.current : DEFAULT_COLORS;
      const n = Math.max(8, Math.min(countRef.current, 24));
      const spd = speedRef.current;
      particlesRef.current = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * spd * 0.45,
        vy: (Math.random() - 0.5) * spd * 0.45,
        radius: 0.6 + Math.random() * 1.2,
        opacity: 0.08 + Math.random() * 0.14,
        color: palette[Math.floor(Math.random() * palette.length)],
      }));
    };

    let resizeTimer = 0;
    const resize = () => {
      const cssW = Math.max(1, window.innerWidth);
      const cssH = Math.max(1, window.innerHeight);
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      const w = Math.max(1, Math.floor(cssW * dpr));
      const h = Math.max(1, Math.floor(cssH * dpr));
      const prev = sizeRef.current;
      if (prev.width === w && prev.height === h) return;
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      sizeRef.current = { width: w, height: h, cssW, cssH, dpr };
      if (particlesRef.current.length === 0) {
        initParticles(w, h);
      } else {
        const sx = w / (prev.width || w);
        const sy = h / (prev.height || h);
        for (const p of particlesRef.current) {
          p.x *= sx;
          p.y *= sy;
        }
      }
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
      const particles = particlesRef.current;

      if (enableConnRef.current && particles.length) {
        const maxDist = connectRef.current * dpr;
        const maxDistSq = maxDist * maxDist;
        ctx.lineWidth = 0.4;
        for (let i = 0; i < particles.length; i++) {
          const p1 = particles[i];
          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < maxDistSq) {
              const opacity = (1 - Math.sqrt(distSq) / maxDist) * 0.025;
              ctx.strokeStyle = `rgba(255,255,255,${opacity})`;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        }
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -p.radius) p.x = width + p.radius;
        else if (p.x > width + p.radius) p.x = -p.radius;
        if (p.y < -p.radius) p.y = height + p.radius;
        else if (p.y > height + p.radius) p.y = -p.radius;
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * dpr, 0, Math.PI * 2);
        ctx.fill();
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
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={cn("pointer-events-none", className)}
      aria-hidden="true"
    />
  );
}

export function GlobalBackground({ className }: { className?: string }) {
  return (
    <div className={cn("fixed inset-0 pointer-events-none", className)}>
      <BackgroundParticles particleCount={16} speed={0.1} enableConnections={false} />
    </div>
  );
}
