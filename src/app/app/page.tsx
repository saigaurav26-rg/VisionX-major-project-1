"use client";

import { useCallback, useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { InferenceResult, fetchModelInfo, runInference, runBatch } from "@/lib/api";
import { UploadZone } from "@/components/upload-zone";
import { ResultViewer } from "@/components/result-viewer";
import { BatchResultViewer } from "@/components/batch-result-viewer";
import { AnalysisDashboard } from "@/components/analysis-dashboard";
import { ModelInfo } from "@/components/model-info";
import type { ModelInfoData } from "@/components/model-info-card";
import { Cpu, Sparkles, ScanSearch, FlaskConical, Wrench } from "lucide-react";

type Phase =
  | { kind: "idle" }
  | { kind: "uploading"; filename: string }
  | { kind: "inferring"; message: string; current?: number; total?: number }
  | { kind: "done"; results: InferenceResult[] }
  | { kind: "error"; message: string };

const VIEW_TO_TAB: Record<string, string> = {
  xray: "xray",
  objects: "objects",
  assistant: "assistant",
  analysis: "restoration",
  metrics: "restoration",
  results: "restoration",
  strength: "strength",
};

export default function VisionXEngine() {
  return (
    <Suspense fallback={<div className="min-h-[50vh] bg-background" />}>
      <EnginePage />
    </Suspense>
  );
}

function EnginePage() {
  const searchParams = useSearchParams();
  const view = searchParams.get("view") || "";
  const defaultTab = VIEW_TO_TAB[view] || "restoration";

  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [modelInfo, setModelInfo] = useState<ModelInfoData | null>(null);
  const [files, setFiles] = useState<{ file: File; meta: { name: string; size: number; width: number; height: number; format: string } }[]>([]);
  const fileRefs = useRef<File[]>([]);
  const [activeBatchIndex, setActiveBatchIndex] = useState(0);

  useEffect(() => {
    fetchModelInfo().then(setModelInfo).catch(() => setModelInfo(null));
  }, []);

  const onSelect = useCallback((newFiles: { file: File; meta: { name: string; size: number; width: number; height: number; format: string } }[] | File[]) => {
    if (!Array.isArray(newFiles) || newFiles.length === 0) {
      setFiles([]);
      fileRefs.current = [];
      setPhase({ kind: "idle" });
      return;
    }
    if (newFiles[0] instanceof File) {
      setFiles([]);
      fileRefs.current = [];
      setPhase({ kind: "idle" });
      return;
    }
    const filesWithMeta = newFiles as { file: File; meta: { name: string; size: number; width: number; height: number; format: string } }[];
    setFiles(filesWithMeta);
    fileRefs.current = filesWithMeta.map((f) => f.file);
    setPhase({ kind: "idle" });
  }, []);

  const onRemoveFile = useCallback((index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    fileRefs.current = newFiles.map((f) => f.file);
    if (newFiles.length === 0) {
      setPhase({ kind: "idle" });
    }
  }, [files]);

  const onDerain = useCallback(async () => {
    const fileList = fileRefs.current;
    if (fileList.length === 0) return;

    setActiveBatchIndex(0);
    setPhase({ kind: "uploading", filename: fileList[0].name });
    await new Promise((r) => setTimeout(r, 120));
    setPhase({ kind: "inferring", message: "Preparing images...", current: 0, total: fileList.length });
    await new Promise((r) => setTimeout(r, 180));

    try {
      if (fileList.length === 1) {
        setPhase({ kind: "inferring", message: "Running VisionX Engine...", current: 1, total: 1 });
        const res = await runInference(fileList[0]);
        setPhase({ kind: "inferring", message: "Reconstructing image..." });
        await new Promise((r) => setTimeout(r, 80));
        setPhase({ kind: "inferring", message: "Generating analysis..." });
        await new Promise((r) => setTimeout(r, 80));
        setPhase({ kind: "inferring", message: "Finalizing result..." });
        await new Promise((r) => setTimeout(r, 80));
        setPhase({ kind: "done", results: [res] });
      } else {
        setPhase({ kind: "inferring", message: "Running VisionX Engine on batch...", current: 0, total: fileList.length });
        const res = await runBatch(fileList);
        if (!res.success) {
          throw new Error("Batch inference failed");
        }
        setPhase({ kind: "inferring", message: "Reconstructing images..." });
        await new Promise((r) => setTimeout(r, 80));
        setPhase({ kind: "inferring", message: "Generating analysis..." });
        await new Promise((r) => setTimeout(r, 80));
        setPhase({ kind: "inferring", message: "Finalizing results..." });
        await new Promise((r) => setTimeout(r, 80));
        setPhase({ kind: "done", results: res.results });
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Inference failed";
      setPhase({ kind: "error", message });
    }
  }, []);

  const onReset = useCallback(() => {
    setFiles([]);
    fileRefs.current = [];
    setActiveBatchIndex(0);
    setPhase({ kind: "idle" });
  }, []);

  const isProcessing = phase.kind === "uploading" || phase.kind === "inferring";
  const progressInfo =
    phase.kind === "inferring" && phase.current && phase.total
      ? ` (${phase.current}/${phase.total})`
      : "";

  const doneResults = phase.kind === "done" ? phase.results : [];
  const safeIndex = doneResults.length ? Math.min(activeBatchIndex, doneResults.length - 1) : 0;
  const activeResult = doneResults[safeIndex];
  const activeFile = fileRefs.current[safeIndex] ?? null;

  const viewCopy: Record<string, { kicker: string; title: string; body: string }> = {
    xray: {
      kicker: "Restoration X-Ray",
      title: "Inspect recovered structure",
      body: "X-Ray views are computed from real restored outputs — residual, detail, and edge maps. Run the engine to generate them.",
    },
    objects: {
      kicker: "Object Detection",
      title: "Auxiliary region analysis",
      body: "Object analysis is a VisionX module that operates on restored frames. It is not the restoration network itself.",
    },
    analysis: {
      kicker: "Image Analysis",
      title: "Pixel-level restoration analysis",
      body: "Metrics are derived from the original and restored images after inference.",
    },
    metrics: {
      kicker: "Metrics",
      title: "Restoration measurements",
      body: "MAD, luma change, edge density, and changed-pixel ratio from actual outputs.",
    },
    results: {
      kicker: "Results",
      title: "Compare and download",
      body: "Side-by-side and slider comparison of rain-degraded input versus VisionX restored output.",
    },
    assistant: {
      kicker: "VisionX Q&A",
      title: "Ask about a restored image",
      body: "Answers are grounded in the restored pixels. Upload and run inference first.",
    },
  };

  const heading = viewCopy[view];

  return (
    <div className="mx-auto max-w-[1400px] px-4 lg:px-8 py-8 lg:py-12">
      <section className="relative overflow-hidden rounded-lg border border-white/10 vx-card-elevated">
        <div className="absolute inset-0 vx-grid-bg opacity-40 pointer-events-none" />
        <div className="relative px-6 lg:px-12 py-10 lg:py-14">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-yellow-400/90 mb-4">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse" />
            {heading?.kicker || "VisionX Engine"}
            <span className="mx-2 opacity-40">•</span>
            <Cpu className="h-3 w-3" />
            {modelInfo?.device || "Loading…"}
          </div>
          <h1 className="text-4xl lg:text-6xl font-semibold tracking-tight leading-tight">
            <span className="vx-text-gradient">VISIONX</span>
            <span className="block text-2xl lg:text-3xl mt-2 text-foreground/90 font-medium">
              {heading?.title || "VisionX Engine"}
            </span>
          </h1>
          <p className="mt-4 text-base lg:text-lg text-muted-foreground max-w-2xl leading-relaxed">
            {heading?.body ||
              "Restore visibility by removing rain degradation from images using the VisionX restoration engine."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Pill icon={<Sparkles className="h-3 w-3" />}>Powered by VisionX</Pill>
            <Pill>Single & Batch Image Deraining</Pill>
            <Pill>Real PyTorch Inference</Pill>
          </div>
        </div>
      </section>

      <section className="mt-8 grid grid-cols-2 lg:grid-cols-7 gap-2 text-xs">
        {[
          { n: "01", label: "Upload" },
          { n: "02", label: "VisionX Engine" },
          { n: "03", label: "VisionX Inference" },
          { n: "04", label: "Restored Images" },
          { n: "05", label: "Analyze" },
          { n: "06", label: "Compare" },
          { n: "07", label: "Download" },
        ].map((s, i) => (
          <div
            key={s.n}
            className="relative px-3 py-2.5 rounded-md border border-white/10 bg-card/40"
          >
            <div className="text-[10px] font-mono text-muted-foreground">{s.n}</div>
            <div className="text-xs text-foreground/90 mt-0.5">{s.label}</div>
            {i < 6 && (
              <span className="hidden lg:block absolute top-1/2 -right-1.5 -translate-y-1/2 text-muted-foreground/50 text-base">
                →
              </span>
            )}
          </div>
        ))}
      </section>

      <section className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          {phase.kind !== "done" && (
            <UploadZone
              onSelect={onSelect}
              files={files}
              onDerain={onDerain}
              processing={isProcessing}
              processingMessage={
                phase.kind === "inferring"
                  ? phase.message + progressInfo
                  : phase.kind === "uploading"
                    ? "Uploading…"
                    : undefined
              }
              errorMessage={phase.kind === "error" ? phase.message : undefined}
              onRemoveFile={onRemoveFile}
            />
          )}

          {phase.kind === "done" && activeResult && (
            <>
              {doneResults.length === 1 ? (
                <ResultViewer result={doneResults[0]} onReset={onReset} />
              ) : (
                <BatchResultViewer
                  results={doneResults}
                  activeIndex={safeIndex}
                  onSelectIndex={setActiveBatchIndex}
                  onReset={onReset}
                />
              )}
              <AnalysisDashboard result={activeResult} originalFile={activeFile} defaultTab={defaultTab} />
            </>
          )}
        </div>

        <aside className="space-y-4">
          <ModelInfo info={modelInfo} />

          <div className="rounded-md border border-white/10 bg-card/40 p-4 space-y-2">
            <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FlaskConical className="h-3 w-3 text-yellow-400" /> VisionX Modules
            </div>
            <ul className="text-sm space-y-1.5 text-foreground/90">
              <li className="flex items-center gap-2"><ScanSearch className="h-3.5 w-3.5 text-yellow-400/80" /> Restoration Analysis</li>
              <li className="flex items-center gap-2"><ScanSearch className="h-3.5 w-3.5 text-yellow-400/80" /> X-Ray Visualization</li>
              <li className="flex items-center gap-2"><ScanSearch className="h-3.5 w-3.5 text-yellow-400/80" /> Object Analysis</li>
              <li className="flex items-center gap-2"><ScanSearch className="h-3.5 w-3.5 text-yellow-400/80" /> Vision Assistant</li>
              <li className="flex items-center gap-2"><Wrench className="h-3.5 w-3.5 text-yellow-400/80" /> Restoration Strength</li>
            </ul>
          </div>

          <div className="rounded-md border border-white/10 bg-card/40 p-4 text-xs space-y-2 text-muted-foreground">
            <div className="text-foreground/90 text-sm">Output</div>
            <div>Default format: PNG</div>
            <div>Filename pattern: {"<original>_derained.png"}</div>
            <div>Max size: 100 MB per image</div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function Pill({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider px-2.5 py-1 rounded-md bg-yellow-400/10 text-yellow-300 ring-1 ring-yellow-400/20">
      {icon}
      {children}
    </span>
  );
}
