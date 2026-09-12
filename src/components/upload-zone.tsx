"use client";

import { useCallback, useRef, useState } from "react";
import { CloudRain, Upload, FileImage, AlertCircle, Loader2, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fmtBytes } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Props {
  onSelect: (files: { file: File; meta: { name: string; size: number; width: number; height: number; format: string } }[] | File[]) => void;
  files: { file: File; meta: { name: string; size: number; width: number; height: number; format: string } }[];
  onDerain: () => void;
  processing: boolean;
  processingMessage?: string;
  errorMessage?: string;
  onRemoveFile: (index: number) => void;
}

const ACCEPTED = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_BYTES = 100 * 1024 * 1024;

function getImageMeta(file: File): Promise<{ name: string; size: number; width: number; height: number; format: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        name: file.name,
        size: file.size,
        width: img.naturalWidth,
        height: img.naturalHeight,
        format: (file.type || "image").replace("image/", "").toUpperCase(),
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

export function UploadZone({ onSelect, files, onDerain, processing, processingMessage, errorMessage, onRemoveFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleFiles = useCallback(async (newFiles: File[]) => {
    setLocalError(null);
    const validatedFiles: File[] = [];
    
    for (const file of newFiles) {
      if (!file.type.startsWith("image/")) {
        setLocalError(`Unsupported file type: ${file.type || "unknown"}`);
        return;
      }
      if (!ACCEPTED.includes(file.type)) {
        setLocalError("Only PNG, JPG, JPEG, WEBP are supported.");
        return;
      }
      if (file.size > MAX_BYTES) {
        setLocalError(`File too large (${fmtBytes(file.size)}). Max ${fmtBytes(MAX_BYTES)}.`);
        return;
      }
      validatedFiles.push(file);
    }
    
    const filesWithMeta = await Promise.all(
      validatedFiles.map(async (file) => ({
        file,
        meta: await getImageMeta(file),
      }))
    );
    
    onSelect(filesWithMeta);
  }, [onSelect]);

  const handleClearAll = useCallback(() => {
    onSelect([]);
  }, [onSelect]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const newFiles = Array.from(e.dataTransfer.files || []);
    if (newFiles.length > 0) handleFiles(newFiles);
  }, [handleFiles]);

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    if (newFiles.length > 0) handleFiles(newFiles);
    e.target.value = "";
  }, [handleFiles]);

  const totalSize = files.reduce((acc, f) => acc + f.file.size, 0);

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !processing && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload rainy images"
        className={cn(
          "relative rounded-2xl border-2 border-dashed transition-all p-10 lg:p-16 text-center cursor-pointer",
          dragging
            ? "border-primary/80 bg-primary/5"
            : "border-border/60 bg-card/30 hover:border-primary/50 hover:bg-card/50",
          files.length > 0 && "border-solid border-primary/40 bg-card/60 cursor-default"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          multiple
          className="sr-only"
          onChange={onChange}
          aria-hidden
        />
        {files.length === 0 && (
          <div className="flex flex-col items-center gap-3">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/30 to-cyan-500/20 flex items-center justify-center ring-1 ring-primary/30">
              <CloudRain className="h-7 w-7 text-cyan-300" />
            </div>
            <div className="text-xl font-medium">Drop your rainy images here</div>
            <div className="text-sm text-muted-foreground">or click to browse (multi-select supported)</div>
            <div className="text-[11px] text-muted-foreground mt-2">
              Supported: PNG, JPG, JPEG, WEBP — Max 100 MB each · any resolution
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="mt-3"
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
            >
              <Upload className="h-4 w-4 mr-1.5" /> Browse files
            </Button>
          </div>
        )}

        {files.length > 0 && (
          <div className="flex flex-col items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-primary/15 flex items-center justify-center ring-1 ring-primary/30">
              <FileImage className="h-6 w-6 text-primary" />
            </div>
            <div className="text-center">
              <div className="text-base font-medium">{files.length} image{files.length > 1 ? "s" : ""} selected</div>
              <div className="text-xs text-muted-foreground mt-1">
                Total: {fmtBytes(totalSize)}
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto w-full space-y-2">
              {files.map((f, index) => (
                <div key={`${f.file.name}-${index}`} className="flex items-center gap-3 p-2 bg-card/50 rounded-lg border border-border/40">
                  <div className="h-8 w-8 rounded bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-sm font-medium truncate">{f.meta.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {fmtBytes(f.meta.size)} · {f.meta.width} × {f.meta.height} · {f.meta.format}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFile(index);
                    }}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={`Remove ${f.meta.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleClearAll();
              }}
              className="text-muted-foreground"
            >
              <X className="h-3.5 w-3.5 mr-1" /> Clear all
            </Button>
          </div>
        )}
      </div>

      {(errorMessage || localError) && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 text-destructive px-4 py-3 text-sm flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>{errorMessage || localError}</div>
        </div>
      )}

      {processing && (
        <div className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm flex items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <div className="text-foreground/90">{processingMessage || "Processing…"}</div>
          <div className="ml-auto text-xs text-muted-foreground font-mono">Real inference</div>
        </div>
      )}

      {files.length > 0 && !processing && (
        <div className="flex items-center gap-2">
          <Button onClick={onDerain} size="lg" className="flex-1 smx:flex-none">
            <CloudRain className="h-4 w-4 mr-2" /> Derain {files.length} image{files.length > 1 ? "s" : ""}
          </Button>
        </div>
      )}
    </div>
  );
}