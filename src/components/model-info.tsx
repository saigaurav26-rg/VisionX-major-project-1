"use client";

import { useEffect, useState } from "react";
import { Cpu, CpuIcon, Loader2, AlertCircle } from "lucide-react";
import type { ModelInfoData } from "@/components/model-info-card";

export function ModelInfo({ info }: { info: ModelInfoData | null }) {
  if (!info) {
    return (
      <div className="rounded-xl border border-border/60 bg-card/40 p-4 text-xs text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-3 w-3 animate-spin" /> Loading model info…
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Engine</div>
          <div className="text-sm font-semibold mt-0.5">VisionX Engine <span className="text-muted-foreground text-xs">v{info.model_version}</span></div>
        </div>
        <div className={info.ready ? "text-emerald-300" : "text-destructive"}>
          <Cpu className={`h-5 w-5 ${info.ready ? "" : "animate-pulse"}`} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <Stat label="Device" value={info.device} />
        <Stat label="Params" value={info.param_count.toLocaleString()} />
        <Stat label="Channels" value={String(info.config.channels)} />
        <Stat label="Blocks" value={String(info.config.num_blocks)} />
        <Stat label="Heads" value={String(info.config.num_heads)} />
        <Stat label="File" value={info.model_file} mono />
      </div>

      {info.last_error && (
        <div className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" /> {info.last_error}
        </div>
      )}

      <div className="text-[11px] text-muted-foreground leading-relaxed border-t border-border/60 pt-3">
        Real PyTorch inference. Weights loaded with{" "}
        <span className="text-foreground/90 font-mono">strict=True</span>.
      </div>
    </div>
  );
}

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-0.5 ${mono ? "font-mono text-[11px]" : ""}`}>{value}</div>
    </div>
  );
}