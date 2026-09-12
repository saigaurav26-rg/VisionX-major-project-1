"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface LoadingScreenProps {
  onComplete: () => void;
  duration?: number;
}

const STAGES = [
  { progress: 0, label: "Initializing VisionX" },
  { progress: 20, label: "Loading restoration engine" },
  { progress: 45, label: "Preparing visual system" },
  { progress: 70, label: "Loading interface" },
  { progress: 90, label: "VisionX ready" },
];

export function LoadingScreen({ onComplete, duration = 900 }: LoadingScreenProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const prefersReduced = mediaQuery.matches;
    const start = performance.now();
    let raf = 0;
    let lastPct = -1;
    let lastStage = "";
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      if (rootRef.current) rootRef.current.classList.add("animate-fade-out");
      window.setTimeout(() => onCompleteRef.current(), 280);
    };

    if (prefersReduced) {
      if (barRef.current) barRef.current.style.width = "100%";
      if (pctRef.current) pctRef.current.textContent = "100%";
      finish();
      return;
    }

    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const pct = Math.round(p * 100);
      if (pct !== lastPct) {
        lastPct = pct;
        if (barRef.current) barRef.current.style.width = `${pct}%`;
        if (pctRef.current) pctRef.current.textContent = `${pct}%`;
      }
      const currentStage = STAGES.findLast((s) => pct >= s.progress);
      if (currentStage && currentStage.label !== lastStage) {
        lastStage = currentStage.label;
        if (stageRef.current) stageRef.current.textContent = currentStage.label;
      }
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        finish();
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration]);

  return (
    <div
      ref={rootRef}
      className={cn("fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black")}
      role="status"
      aria-label="Loading VisionX"
    >
      <div className="relative z-10 flex flex-col items-center gap-8 text-white">
        <div className="flex flex-col items-center gap-4">
          <span className="text-4xl lg:text-6xl font-semibold tracking-tight">VISIONX</span>
          <span className="text-xs uppercase tracking-[0.3em] text-white/50">INITIALIZING...</span>
        </div>

        <div className="relative w-[min(24rem,80vw)]">
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div ref={barRef} className="h-full bg-white rounded-full" style={{ width: "0%" }} />
          </div>
          <div className="flex justify-between mt-3 text-xs font-mono text-white/60">
            <span>0%</span>
            <span ref={pctRef}>0%</span>
            <span>100%</span>
          </div>
        </div>

        <div ref={stageRef} className="text-xs text-white/40 font-mono min-h-[1.25rem] text-center">
          {STAGES[0].label}
        </div>
      </div>
    </div>
  );
}
