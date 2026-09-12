"use client";

import { useEffect, useRef, useState } from "react";
import { InferenceResult, analyzeRestoration, analyzeXray, analyzeObjects, askVisionAssistant, fmtMs, fmtBytes } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ScanSearch,
  Sparkles,
  Box,
  Bot,
  Wrench,
  Loader2,
  Activity,
  Gauge,
  Image as ImageIcon,
  Send,
} from "lucide-react";

interface Props {
  result: InferenceResult;
  originalFile: File | null;
  defaultTab?: string;
}

const SUGGESTIONS = [
  "What changed after deraining?",
  "Which areas became clearer?",
  "Where is rain still visible?",
  "Compare original and restored image.",
];

export function AnalysisDashboard({ result, originalFile, defaultTab = "restoration" }: Props) {
  return (
    <Card className="border-white/10 bg-card/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> VisionX Analysis
          </CardTitle>
          <span className="text-xs text-muted-foreground truncate max-w-[50%]">
            {result?.filename ?? "Powered by VisionX output"}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs key={`${result?.request_id ?? "none"}-${defaultTab}`} defaultValue={defaultTab} className="w-full">
          <TabsList className="grid grid-cols-5 w-full bg-secondary/40">
            <TabsTrigger value="restoration" className="text-xs gap-1">
              <ScanSearch className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Restoration</span>
            </TabsTrigger>
            <TabsTrigger value="xray" className="text-xs gap-1">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden md:inline">X-Ray</span>
            </TabsTrigger>
            <TabsTrigger value="objects" className="text-xs gap-1">
              <Box className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Objects</span>
            </TabsTrigger>
            <TabsTrigger value="assistant" className="text-xs gap-1">
              <Bot className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Assistant</span>
            </TabsTrigger>
            <TabsTrigger value="strength" className="text-xs gap-1">
              <Wrench className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Strength</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="restoration" className="mt-4">
            <RestorationTab result={result} originalFile={originalFile} />
          </TabsContent>
          <TabsContent value="xray" className="mt-4">
            <XRayTab result={result} originalFile={originalFile} />
          </TabsContent>
          <TabsContent value="objects" className="mt-4">
            <ObjectsTab result={result} originalFile={originalFile} />
          </TabsContent>
          <TabsContent value="assistant" className="mt-4">
            <AssistantTab result={result} originalFile={originalFile} />
          </TabsContent>
          <TabsContent value="strength" className="mt-4">
            <StrengthTab result={result} originalFile={originalFile} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

/* ============================================================ */

function RestorationTab({ result, originalFile }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!originalFile) return;
    let cancelled = false;
    setLoading(true);
    analyzeRestoration(originalFile)
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setData({ metrics: result.metrics }); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // Refetch whenever the selected image changes (batch tab switch), not just on mount.
  }, [result.request_id, originalFile]);

  const metrics = data?.metrics || result.metrics;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric label="Pixel MAD" value={metrics.mean_abs_difference} />
        <Metric label="Δ Luma" value={metrics.luma_change} signed />
        <Metric label="Edge Density Δ" value={metrics.edge_density_change} signed />
        <Metric label="Changed Pixels" value={metrics.changed_pixel_ratio} format="pct" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <VisualCard title="Restoration Residual Map" subtitle="|original − derained|">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
            <img src={data?.residual_map_url} alt="Residual" className="rounded-md" />
          )}
        </VisualCard>
        <VisualCard title="Detail Recovery" subtitle="High-frequency changes">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
            <img src={data?.detail_map_url} alt="Detail" className="rounded-md" />
          )}
        </VisualCard>
      </div>

      <div className="rounded-lg border border-border/60 bg-card/40 p-4 text-sm">
        <div className="font-medium mb-1">Restoration Summary</div>
        <p className="text-muted-foreground leading-relaxed">
          Analytical observation based on actual pixel values. Higher pixel MAD
          indicates more restoration activity. Edge density Δ reflects
          structural change; positive values suggest recovered high-frequency detail.
          No external VLM is used.
        </p>
      </div>
    </div>
  );
}

/* ============================================================ */

function XRayTab({ result, originalFile }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"details" | "edges" | "residual">("details");

  useEffect(() => {
    if (!originalFile) return;
    let cancelled = false;
    setLoading(true);
    setView("details"); // reset sub-view for the newly selected image
    analyzeXray(originalFile)
      .then((d) => { if (!cancelled) setData(d); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [result.request_id, originalFile]);

  if (loading) return <CenteredSpinner />;

  const urls: Record<string, { url?: string; title: string; sub: string }> = {
    details: { url: data?.detail_map_url, title: "Detail Map", sub: "High-frequency differences between original and derained." },
    edges: { url: data?.edge_difference_url, title: "Edge Difference", sub: "Comparison of structural edges between original and derained." },
    residual: { url: data?.residual_url, title: "Residual Map", sub: "Pixel-level |original − derained| residual (amplified for visibility)." },
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 text-xs">
        {(["details", "edges", "residual"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setView(k)}
            className={`px-3 py-1.5 rounded-md border ${
              view === k
                ? "border-primary/50 bg-primary/15 text-foreground"
                : "border-border/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            {k === "details" ? "Details" : k === "edges" ? "Edges" : "Residual"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <VisualCard title="Original" subtitle="Rainy / Input">
          <img src={result.original_image} alt="Original" className="rounded-md" />
        </VisualCard>
        <VisualCard title="Derained" subtitle="VisionX Output">
          <img src={result.derained_image} alt="Derained" className="rounded-md" />
        </VisualCard>
      </div>

      <VisualCard title={urls[view].title} subtitle={urls[view].sub}>
        <img src={urls[view].url} alt={urls[view].title} className="rounded-md" />
      </VisualCard>

      <EdgePair
          edgeOriginal={data?.edge_original_url}
          edgeDerained={data?.edge_derained_url}
        />

      <p className="text-xs text-muted-foreground">
        These are analytical visualizations derived from the real VisionX output. They
        do not represent internal feature activations of the network.
      </p>
    </div>
  );
}

function EdgePair({ edgeOriginal, edgeDerained }: { edgeOriginal?: string; edgeDerained?: string }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <VisualCard title="Edge Map — Original" subtitle="Canny-style edge map">
        {edgeOriginal && <img src={edgeOriginal} alt="Edge Original" className="rounded-md" />}
      </VisualCard>
      <VisualCard title="Edge Map — Derained" subtitle="Canny-style edge map">
        {edgeDerained && <img src={edgeDerained} alt="Edge Derained" className="rounded-md" />}
      </VisualCard>
    </div>
  );
}

/* ============================================================ */

function ObjectsTab({ result, originalFile }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!originalFile) return;
    let cancelled = false;
    setLoading(true);
    analyzeObjects(originalFile)
      .then((d) => { if (!cancelled) setData(d); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [result.request_id, originalFile]);

  if (loading) return <CenteredSpinner />;

  return (
    <div className="space-y-4">
      <div className="rounded-md bg-amber-500/10 border border-amber-400/20 px-3 py-2 text-xs text-amber-200/90">
        Object detection is an auxiliary VisionX analysis module. It is not part of the restoration network.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <VisualCard title="Original" subtitle="Rainy / Input">
          <img src={result.original_image} alt="Original" className="rounded-md" />
        </VisualCard>
        <VisualCard title="Derained" subtitle="VisionX Output">
          <img src={result.derained_image} alt="Derained" className="rounded-md" />
        </VisualCard>
      </div>

      <div>
        <div className="text-sm font-medium mb-2">Region Analysis</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {(data?.regions || []).map((r: any) => (
            <div key={r.region} className="rounded-md border border-border/60 bg-card/40 p-3 text-xs">
              <div className="font-mono text-foreground/90">{r.region}</div>
              <div className="mt-1 grid grid-cols-2 gap-1 text-muted-foreground">
                <span>Contrast Δ</span>
                <span className={r.contrast_change > 0 ? "text-emerald-300" : "text-rose-300"}>
                  {(r.contrast_change > 0 ? "+" : "")}{r.contrast_change.toFixed(4)}
                </span>
                <span>Luma Before</span>
                <span>{r.luma_before.toFixed(3)}</span>
                <span>Luma After</span>
                <span>{r.luma_after.toFixed(3)}</span>
              </div>
              <div className="mt-2 text-[10px] uppercase tracking-wider">
                {r.visibility_improved ? "Visibility improved" : "No major change"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {data?.overlay_url && (
        <VisualCard title="Indicative Saliency Overlay" subtitle="Edge-based saliency proxy">
          <img src={data.overlay_url} alt="Overlay" className="rounded-md" />
        </VisualCard>
      )}
    </div>
  );
}

/* ============================================================ */

function AssistantTab({ result, originalFile }: Props) {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(result.request_id);

  // Chat is per-image: clear history whenever the selected batch image changes,
  // so an answer about bear.png doesn't linger while you're looking at cat.png.
  useEffect(() => {
    if (requestIdRef.current !== result.request_id) {
      requestIdRef.current = result.request_id;
      setMessages([]);
      setInput("");
    }
  }, [result.request_id]);

  const ask = async (q: string) => {
    if (!q.trim() || loading || !originalFile) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setLoading(true);
    try {
      const res = await askVisionAssistant(q, originalFile);
      setMessages((m) => [...m, { role: "assistant", text: res.answer || res.summary || "—" }]);
    } catch (e: any) {
      setMessages((m) => [...m, { role: "assistant", text: "Sorry — failed to compute answer." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-border/60 bg-card/40 p-4 min-h-[200px] space-y-2">
        {messages.length === 0 && (
          <div className="text-sm text-muted-foreground">
            Ask about this image. Answers are derived from the real VisionX output and pixel-level analysis.
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`rounded-md px-3 py-2 text-sm ${
              m.role === "user"
                ? "bg-primary/15 text-foreground ml-8"
                : "bg-secondary/60 text-foreground/90 mr-8"
            }`}
          >
            <div className="text-[10px] uppercase tracking-wider opacity-60 mb-0.5">
              {m.role === "user" ? "You" : "Vision Assistant"}
            </div>
            {m.text}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Analyzing…
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => ask(s)}
            className="text-xs px-2.5 py-1 rounded-md bg-secondary/40 hover:bg-secondary/70 text-foreground/80 border border-border/60"
          >
            {s}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="flex items-center gap-2"
      >
        <Input
          placeholder="Ask a question…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={loading}>
          <Send className="h-3.5 w-3.5" />
        </Button>
      </form>

      <p className="text-[11px] text-muted-foreground">
        The assistant distinguishes between factual image observation and model interpretation.
        No external VLM is used.
      </p>
    </div>
  );
}

/* ============================================================ */

function StrengthTab({ result, originalFile: _originalFile }: Props) {
  const [alpha, setAlpha] = useState(1.0);
  const pct = Math.round(alpha * 100);
  const label = pct < 25 ? "Mild" : pct < 60 ? "Moderate" : pct < 95 ? "Strong" : "Full VisionX";

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border/60 bg-card/40 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium flex items-center gap-2">
            <Wrench className="h-4 w-4 text-primary" /> Restoration Strength
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            {label} · {pct}%
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-12">Mild</span>
          <Slider
            value={[alpha]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={(v) => setAlpha(v[0])}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground w-12 text-right">Strong</span>
        </div>

        <div className="grid grid-cols-4 gap-2 mt-3 text-[11px] text-muted-foreground text-center">
          {[
            { p: 0, l: "Original" },
            { p: 0.25, l: "Mild" },
            { p: 0.5, l: "Moderate" },
            { p: 1.0, l: "Full" },
          ].map((s) => (
            <button
              key={s.p}
              onClick={() => setAlpha(s.p)}
              className={`py-1.5 rounded-md border ${
                Math.abs(alpha - s.p) < 0.01
                  ? "border-primary/50 bg-primary/15"
                  : "border-border/60 hover:border-border"
              }`}
            >
              {s.l}
            </button>
          ))}
        </div>

        <p className="text-[11px] text-muted-foreground mt-3">
          output = (1 − α) · original + α · derained. This is a post-processing blend,
          not a modification of the trained restoration architecture.
        </p>
      </div>

      <VisualCard title={`Preview at ${pct}%`} subtitle="Blend result">
        <BlendedImage original={result.original_image} derained={result.derained_image} alpha={alpha} />
      </VisualCard>
    </div>
  );
}

function BlendedImage({ original, derained, alpha }: { original: string; derained: string; alpha: number }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    async function go() {
      if (alpha >= 0.999) {
        setUrl(derained);
        return;
      }
      if (alpha <= 0.001) {
        setUrl(original);
        return;
      }
      const [oi, di] = await Promise.all([loadImage(original), loadImage(derained)]);
      const c = document.createElement("canvas");
      c.width = oi.width;
      c.height = oi.height;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(oi, 0, 0);
      ctx.globalAlpha = alpha;
      ctx.drawImage(di, 0, 0);
      ctx.globalAlpha = 1;
      const out = c.toDataURL("image/png");
      if (!cancelled) setUrl(out);
    }
    go();
    return () => {
      cancelled = true;
    };
  }, [alpha, original, derained]);

  return url ? <img src={url} alt="Blended" className="rounded-md" /> : <CenteredSpinner />;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/* ============================================================ */

function Metric({
  label,
  value,
  signed,
  format,
}: {
  label: string;
  value: number | string;
  signed?: boolean;
  format?: "pct";
}) {
  let display = "N/A";
  if (typeof value === "number") {
    display = value.toFixed(4);
    if (signed && value > 0) display = `+${display}`;
    if (format === "pct") display = `${(value * 100).toFixed(1)}%`;
  } else if (typeof value === "string") {
    display = value;
  }
  return (
    <div className="rounded-md border border-border/60 bg-card/40 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-lg font-mono mt-1">{display}</div>
    </div>
  );
}

function VisualCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/40 overflow-hidden">
      <div className="px-4 py-2 border-b border-border/60">
        <div className="text-sm font-medium">{title}</div>
        {subtitle && <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>}
      </div>
      <div className="p-3 bg-black/40 flex items-center justify-center min-h-[120px]">{children}</div>
    </div>
  );
}

function CenteredSpinner() {
  return (
    <div className="flex items-center justify-center py-10 text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin mr-2" /> Analyzing…
    </div>
  );
}