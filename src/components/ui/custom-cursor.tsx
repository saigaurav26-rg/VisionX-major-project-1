"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface CustomCursorProps {
  enabled?: boolean;
}

function asElement(target: EventTarget | null): Element | null {
  if (!target) return null;
  if (target instanceof Element) return target;
  if (typeof Text !== "undefined" && target instanceof Text) {
    return target.parentElement;
  }
  return null;
}

export function CustomCursor({ enabled = true }: CustomCursorProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const targetRef = useRef({ x: -100, y: -100 });
  const currentRef = useRef({ x: -100, y: -100 });
  const ringSizeRef = useRef(24);
  const targetRingSizeRef = useRef(24);
  const hoveringRef = useRef(false);
  const shownRef = useRef(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touchPoints = navigator.maxTouchPoints > 1 && coarse;
    if (coarse || reduce || touchPoints) return;

    setActive(true);

    const applyHover = (type: "default" | "button" | "image" | "link" | "none") => {
      if (type === "none") {
        hoveringRef.current = false;
        targetRingSizeRef.current = 24;
        if (labelRef.current) labelRef.current.style.opacity = "0";
        return;
      }
      hoveringRef.current = true;
      if (type === "button") targetRingSizeRef.current = 40;
      else if (type === "link") targetRingSizeRef.current = 36;
      else if (type === "image") {
        targetRingSizeRef.current = 38;
        if (labelRef.current) labelRef.current.style.opacity = "1";
      } else targetRingSizeRef.current = 28;
      if (type !== "image" && labelRef.current) labelRef.current.style.opacity = "0";
    };

    const handleMove = (e: MouseEvent) => {
      targetRef.current.x = e.clientX;
      targetRef.current.y = e.clientY;
      if (!shownRef.current && rootRef.current) {
        shownRef.current = true;
        rootRef.current.style.opacity = "1";
        document.documentElement.classList.add("custom-cursor-enabled");
      }
    };

    const handleMouseDown = () => {
      if (ringRef.current) ringRef.current.style.opacity = "0.55";
    };
    const handleMouseUp = () => {
      if (ringRef.current) ringRef.current.style.opacity = hoveringRef.current ? "1" : "0.7";
    };

    const handleMouseOver = (e: Event) => {
      const el = asElement(e.target);
      if (!el || typeof el.closest !== "function") {
        applyHover("none");
        return;
      }
      try {
        if (el.closest("button, [role='button']")) applyHover("button");
        else if (el.closest("a")) applyHover("link");
        else if (el.closest("img")) applyHover("image");
        else applyHover("default");
      } catch {
        applyHover("none");
      }
    };

    const handleLeave = () => {
      if (rootRef.current) rootRef.current.style.opacity = "0";
      shownRef.current = false;
    };

    window.addEventListener("mousemove", handleMove, { passive: true });
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mouseleave", handleLeave);
    document.addEventListener("mouseover", handleMouseOver, true);

    const animate = () => {
      currentRef.current.x += (targetRef.current.x - currentRef.current.x) * 0.2;
      currentRef.current.y += (targetRef.current.y - currentRef.current.y) * 0.2;
      ringSizeRef.current += (targetRingSizeRef.current - ringSizeRef.current) * 0.22;
      const node = rootRef.current;
      if (node) {
        node.style.transform = `translate3d(${currentRef.current.x}px, ${currentRef.current.y}px, 0) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        const size = ringSizeRef.current;
        ringRef.current.style.width = `${size}px`;
        ringRef.current.style.height = `${size}px`;
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mouseleave", handleLeave);
      document.removeEventListener("mouseover", handleMouseOver, true);
      document.documentElement.classList.remove("custom-cursor-enabled");
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [enabled]);

  if (!active) return null;

  return (
    <div
      ref={rootRef}
      className={cn("fixed pointer-events-none z-[9999] left-0 top-0")}
      style={{ willChange: "transform", opacity: 0 }}
      aria-hidden="true"
    >
      <div
        ref={ringRef}
        className="absolute rounded-full border border-yellow-400/70"
        style={{
          width: 24,
          height: 24,
          transform: "translate(-50%, -50%)",
          opacity: 0.7,
        }}
      />
      <div
        className="absolute rounded-full bg-white"
        style={{
          width: 4,
          height: 4,
          transform: "translate(-50%, -50%)",
        }}
      />
      <div
        ref={labelRef}
        className="absolute text-white text-[10px] font-mono uppercase tracking-wider whitespace-nowrap pointer-events-none"
        style={{
          transform: "translate(-50%, calc(-50% - 28px))",
          opacity: 0,
        }}
      >
        VIEW
      </div>
    </div>
  );
}

export function CursorProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <CustomCursor />
    </>
  );
}
