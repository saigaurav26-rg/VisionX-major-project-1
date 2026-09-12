"use client";

import { InferenceResult, fmtMs, imageUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, RotateCcw, Eye, FileText, Archive, Minimize2, Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import JSZip from "jszip";

interface Props {
  results: InferenceResult[];
  activeIndex: number;
  onSelectIndex: (index: number) => void;
  onReset: () => void;
}

export function BatchResultViewer({ results, activeIndex, onSelectIndex, onReset }: Props) {
  const [mode, setMode] = useState<"slider" | "side">("slider");
  const [sliderPos, setSliderPos] = useState(50);
  const [zoom, setZoom] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);

  const currentResult = results[activeIndex] ?? results[0];

  const handleDownload = async (result: InferenceResult) => {
    const a = document.createElement('a');
    a.href = result.derained_image;
    a.download = result.download_filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadAll = async () => {
    const zip = new JSZip();

    for (const result of results) {
      try {
        const filename = result.derained_url?.split("/").pop();
        if (filename) {
          const response = await fetch(imageUrl(filename));
          const blob = await response.blob();
          zip.file(result.download_filename, blob);
        } else {
          const base64 = result.derained_image.split(',')[1];
          zip.file(result.download_filename, base64, { base64: true });
        }
      } catch (e) {
        const base64 = result.derained_image.split(',')[1];
        zip.file(result.download_filename, base64, { base64: true });
      }
    }

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visionx_batch_${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-2xl border border-border/60 vx-card-elevated overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 lg:px-6 py-4 border-b border-border/60">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            Batch Restoration Results
          </h2>
          <div className="text-xs text-muted-foreground mt-0.5">
            {results.length} images processed · Click tabs to switch
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
          <Button onClick={handleDownloadAll} size="sm">
            <Archive className="h-3.5 w-3.5 mr-1" /> Download All (ZIP)
          </Button>
        </div>
      </div>

      <Tabs
        value={currentResult?.request_id ?? ""}
        onValueChange={(v) => {
          const idx = results.findIndex((r) => r.request_id === v);
          if (idx !== -1) onSelectIndex(idx);
        }}
        className="border-b border-border/60"
      >
        {/* flex + wrap instead of an unconfigured `grid` — the bare `grid w-full`
           had no grid-template-columns, so with 3+ tabs it collapsed into one
           implicit column and the triggers overlapped/stacked. */}
        <TabsList className="flex flex-wrap items-stretch gap-1 bg-secondary/40 p-1 h-auto">
          {results.map((result, index) => (
            <TabsTrigger
              key={result.request_id}
              value={result.request_id}
              className="flex-1 min-w-[110px] basis-[110px] justify-center text-xs py-1.5 px-3 gap-1"
            >
              <FileText className="h-3 w-3 shrink-0" />
              <span className="truncate">{result.filename}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="relative bg-black/60 p-4 lg:p-6">
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
              <div className="relative" style={{ width: currentResult.input_width, height: currentResult.input_height }}>
                <NextImage src={currentResult.original_image} alt="Original" w={currentResult.input_width} h={currentResult.input_height} />
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${sliderPos}%` }}
                >
                  <NextImage
                    src={currentResult.derained_image}
                    alt="Derained"
                    w={currentResult.input_width}
                    h={currentResult.input_height}
                    style={{ minWidth: `${100 / (sliderPos / 100)}%` }}
                  />
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={sliderPos}
                  onChange={(e) => setSliderPos(parseInt(e.target.value))}
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
                  style={{ left: `${sliderPos}%` }}
                />
              </div>
            ) : (
              <div className="flex">
                <div className="relative" style={{ width: currentResult.input_width / 2, height: currentResult.input_height / 2 }}>
                  <NextImage src={currentResult.original_image} alt="Original" w={currentResult.input_width / 2} h={currentResult.input_height / 2} />
                  <div className="absolute top-2 left-2 text-[10px] uppercase tracking-wider bg-black/60 px-2 py-1 rounded">
                    Original / Rainy
                  </div>
                </div>
                <div className="relative" style={{ width: currentResult.input_width / 2, height: currentResult.input_height / 2 }}>
                  <NextImage src={currentResult.derained_image} alt="Derained" w={currentResult.input_width / 2} h={currentResult.input_height / 2} />
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
        <Stat label="Model" value={`${currentResult.model_name} v${currentResult.model_version}`} />
        <Stat label="Device" value={currentResult.device} />
        <Stat label="Input" value={`${currentResult.input_width} × ${currentResult.input_height}`} />
        <Stat label="Output" value={`${currentResult.output_width} × ${currentResult.output_height}`} />
        <Stat label="Processing" value={fmtMs(currentResult.processing_time)} />
        <Stat label="Format" value="PNG" />
      </div>

      <div className="px-4 lg:px-6 py-4 border-t border-border/60">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>Download individual:</span>
          {results.map((result) => (
            <Button
              key={result.request_id}
              variant="ghost"
              size="sm"
              onClick={() => handleDownload(result)}
              className="text-xs"
            >
              <Download className="h-3 w-3 mr-1" />
              {result.download_filename}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

function NextImage({ src, alt, w, h, style }: { src: string; alt: string; w: number; h: number; style?: React.CSSProperties }) {
  return <img src={src} alt={alt} style={{ width: w, height: h, display: "block", ...style }} draggable={false} />;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-mono mt-0.5">{value}</div>
    </div>
  );
}