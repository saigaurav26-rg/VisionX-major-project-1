"use client";

import Link from "next/link";
import {
  Sparkles,
  ScanSearch,
  ImageIcon,
  Layers,
  FlaskConical,
  Gauge,
  Globe,
  Bot,
  Cpu,
  History,
  Settings,
  ArrowRight,
} from "lucide-react";

const MODULES = [
  {
    href: "/app",
    label: "VisionX Engine",
    group: "Restoration",
    desc: "Upload rainy images and run real restoration inference.",
    icon: Sparkles,
  },
  {
    href: "/app?view=xray",
    label: "Restoration X-Ray",
    group: "Restoration",
    desc: "Inspect residual, detail, and edge maps from actual outputs.",
    icon: ScanSearch,
  },
  {
    href: "/app?view=results",
    label: "Results",
    group: "Restoration",
    desc: "Compare original and restored images with download.",
    icon: ImageIcon,
  },
  {
    href: "/app?view=objects",
    label: "Object Detection",
    group: "Analysis",
    desc: "Auxiliary region analysis on restored frames.",
    icon: Layers,
  },
  {
    href: "/app?view=analysis",
    label: "Image Analysis",
    group: "Analysis",
    desc: "Pixel-level restoration metrics from real outputs.",
    icon: FlaskConical,
  },
  {
    href: "/app?view=metrics",
    label: "Metrics",
    group: "Analysis",
    desc: "MAD, luma change, edge density, changed-pixel ratio.",
    icon: Gauge,
  },
  {
    href: "/applications",
    label: "Real-World Applications",
    group: "Analysis",
    desc: "Potential downstream uses of VisionX restoration.",
    icon: Globe,
  },
  {
    href: "/app?view=assistant",
    label: "VisionX Q&A",
    group: "Assistant",
    desc: "Ask questions grounded in the restored image.",
    icon: Bot,
  },
  {
    href: "/model",
    label: "Model",
    group: "System",
    desc: "Architecture, configuration, and checkpoint info.",
    icon: Cpu,
  },
  {
    href: "/history",
    label: "History",
    group: "System",
    desc: "Local inference log of previous restorations.",
    icon: History,
  },
  {
    href: "/settings",
    label: "Settings",
    group: "System",
    desc: "Client preferences for comparison and output.",
    icon: Settings,
  },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 lg:px-8 py-8 lg:py-12">
      <section className="relative overflow-hidden rounded-lg border border-white/10 vx-card-elevated">
        <div className="absolute inset-0 vx-grid-bg opacity-40 pointer-events-none" />
        <div className="relative px-6 lg:px-10 py-10 lg:py-14">
          <div className="text-xs uppercase tracking-[0.2em] text-yellow-400/90 mb-4">
            VisionX Application
          </div>
          <h1 className="text-4xl lg:text-5xl font-semibold tracking-tight">
            <span className="vx-text-gradient">VISIONX</span>
          </h1>
          <p className="mt-3 text-base lg:text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Internal restoration interface. Run the engine, inspect recovered
            detail, and analyze outputs from real inference — not simulated results.
          </p>
          <Link
            href="/app"
            className="inline-flex items-center gap-2 mt-6 text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
          >
            Open VisionX Engine
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {MODULES.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="group rounded-md border border-white/10 bg-card/40 p-5 hover:border-yellow-400/40 hover:bg-yellow-400/5 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/40">
                {m.group}
              </span>
              <m.icon className="h-4 w-4 text-yellow-400/80" />
            </div>
            <div className="text-sm font-medium text-white group-hover:text-yellow-300">
              {m.label}
            </div>
            <p className="mt-1.5 text-xs text-white/50 leading-relaxed">{m.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
