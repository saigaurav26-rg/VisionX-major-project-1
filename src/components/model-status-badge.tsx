"use client";

import { useEffect, useState } from "react";
import { Cpu, Loader2, AlertTriangle } from "lucide-react";
import { fetchHealth } from "@/lib/api";

interface ModelStatus {
  status: string;
  model_ready: boolean;
  device: string;
}

export function ModelStatusBadge() {
  const [status, setStatus] = useState<ModelStatus | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetch_ = () =>
      fetchHealth()
        .then((s) => mounted && setStatus(s))
        .catch(() => mounted && setStatus({ status: "offline", model_ready: false, device: "—" }));
    fetch_();
    const id = setInterval(fetch_, 15000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  if (!status) {
    return (
      <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-secondary/60 text-muted-foreground ring-1 ring-border">
        <Loader2 className="h-3 w-3 animate-spin" />
        Connecting
      </div>
    );
  }

  if (!status.model_ready) {
    return (
      <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-destructive/15 text-destructive ring-1 ring-destructive/30">
        <AlertTriangle className="h-3 w-3" />
        {status.status === "offline" ? "Engine offline" : "Model initializing"}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-400/30">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </span>
        VisionX
      </div>
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary/60 text-muted-foreground ring-1 ring-border">
        <Cpu className="h-3 w-3" />
        {status.device}
      </div>
    </div>
  );
}