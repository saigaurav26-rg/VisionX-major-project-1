"use client";

import { useRef, useState } from "react";
import { InferenceResult, fmtMs } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Download, RotateCcw, ZoomIn, ZoomOut, Maximize2, Minimize2, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  result: InferenceResult;
  onReset: () => void;
}

export function ResultViewer({ result, onReset }: Props) {
  const [mode, setMode] = useState<"slider" | "side">("slider");
  const [pos, setPos] = useState(50);
  const [zoom, setZoom] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = result.derained_image;
    a.download = result.download_filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="rounded-2xl border border-border/60 vx-card-elevated overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 lg:px-6 py-4 border-b border-border/60">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            Restoration Result
          </h2>
          <div className="text-xs text-muted-foreground mt-0.5">
            {result.filename} · {result.input_width} × {result.input_height} ·{" "}
            {result.device} · {fmtMs(result.processing_time)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md border border-border/60 overflow-hidden text-xs">
            <button
              onClick={() => setMode("slider")}
              className={cn(
                "px-3 py-1.5",
                mode === "slider" ? "bg-primary/20 text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Slider
            </button>
            <button
              onClick={() => setMode("side")}
              className={cn(
                "px-3 py-1.5 border-l border-border/60",
                mode === "side" ? "bg-primary/20 text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Side-by-side
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={onReset}>
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Process another
          </Button>
          <Button onClick={handleDownload} size="sm">
            <Download className="h-3.5 w-3.5 mr-1" /> Download
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className={cn(
          "relative bg-black/60 p-4 lg:p-6",
          fullscreen && "fixed inset-0 z-50 bg-black/95 p-2 lg:p-4"
        )}
      >
        <div className="flex items-center gap-2 mb-3 text-xs">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
            aria-label="Zoom in"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
            aria-label="Zoom out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setZoom(1)}>
            Reset
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setFullscreen((f) => !f)}>
            {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            {fullscreen ? "Exit" : "Fit"}
          </Button>
          <div className="ml-auto font-mono text-muted-foreground">Zoom: {Math.round(zoom * 100)}%</div>
        </div>

        <div className="overflow-auto rounded-lg border border-border/40">
          <div
            className="relative inline-block origin-top-left"
            style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
          >
            {mode === "slider" ? (
              <div className="relative" style={{ width: result.input_width, height: result.input_height }}>
                <NextImage src={result.original_image} alt="Original" w={result.input_width} h={result.input_height} />
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${pos}%` }}
                >
                  <NextImage
                    src={result.derained_image}
                    alt="Derained"
                    w={result.input_width}
                    h={result.input_height}
                    style={{ minWidth: `${100 / (pos / 100)}%` }}
                  />
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={pos}
                  onChange={(e) => setPos(parseInt(e.target.value))}
                  className="absolute inset-x-0 bottom-2 mx-auto w-[80%] accent-primary"
                  aria-label="Comparison slider"
                />
                <div className="absolute top-2 left-2 text-[10px] uppercase tracking-wider bg-black/60 px-2 py-1 rounded">
                  Rainy
                </div>
                <div className="absolute top-2 right-2 text-[10px] uppercase tracking-wider bg-primary/70 px-2 py-1 rounded">
                  VisionX
                </div>
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-primary"
                  style={{ left: `${pos}%` }}
                />
              </div>
            ) : (
              <div className="flex">
                <div className="relative" style={{ width: result.input_width / 2, height: result.input_height / 2 }}>
                  <NextImage src={result.original_image} alt="Original" w={result.input_width / 2} h={result.input_height / 2} />
                  <div className="absolute top-2 left-2 text-[10px] uppercase tracking-wider bg-black/60 px-2 py-1 rounded">
                    Original / Rainy
                  </div>
                </div>
                <div className="relative" style={{ width: result.input_width / 2, height: result.input_height / 2 }}>
                  <NextImage src={result.derained_image} alt="Derained" w={result.input_width / 2} h={result.input_height / 2} />
                  <div className="absolute top-2 left-2 text-[10px] uppercase tracking-wider bg-primary/70 px-2 py-1 rounded">
                    VisionX / Restored
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 px-4 lg:px-6 py-4 border-t border-border/60 text-xs">
        <Stat label="Model" value={`${result.model_name} v${result.model_version}`} />
        <Stat label="Device" value={result.device} />
        <Stat label="Input" value={`${result.input_width} × ${result.input_height}`} />
        <Stat label="Output" value={`${result.output_width} × ${result.output_height}`} />
        <Stat label="Processing" value={fmtMs(result.processing_time)} />
        <Stat label="Format" value="PNG" />
      </div>
    </div>
  );
}

function NextImage({
  src,
  alt,
  w,
  h,
  style,
}: {
  src: string;
  alt: string;
  w: number;
  h: number;
  style?: React.CSSProperties;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      style={{ width: w, height: h, display: "block", ...style }}
      draggable={false}
    />
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-mono mt-0.5">{value}</div>
    </div>
  );
}