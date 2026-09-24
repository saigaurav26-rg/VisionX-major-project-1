"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, Lock, Palette, Download, FileImage, Gauge } from "lucide-react";

const KEY = "visionx.settings";

interface Settings {
  theme: "dark" | "light";
  outputFormat: "PNG" | "JPG";
  maxUploadMB: number;
  sliderDefault: number;
  comparisonMode: "slider" | "side";
}

const DEFAULTS: Settings = {
  theme: "dark",
  outputFormat: "PNG",
  maxUploadMB: 25,
  sliderDefault: 100,
  comparisonMode: "slider",
};

export default function SettingsPage() {
  const [s, setS] = useState<Settings>(DEFAULTS);

  // HTML root element par theme apply karne ka helper
  const applyTheme = (themeMode: "dark" | "light") => {
    const root = document.documentElement;
    if (themeMode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = { ...DEFAULTS, ...JSON.parse(raw) };
        setS(parsed);
        applyTheme(parsed.theme);
      } else {
        applyTheme(DEFAULTS.theme);
      }
    } catch {
      applyTheme(DEFAULTS.theme);
    }
  }, []);

  const save = (next: Settings) => {
    setS(next);
    localStorage.setItem(KEY, JSON.stringify(next));
    applyTheme(next.theme);
  };

  return (
    <div className="mx-auto max-w-[900px] px-4 lg:px-8 py-8 lg:py-12 space-y-6">
      <header className="space-y-2">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
          <SettingsIcon className="h-3 w-3" /> Preferences
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Client-side preferences for the VisionX UI.</p>
      </header>

      <Card className="border-border/60 bg-card/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" /> Theme
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 text-sm">
          {(["dark", "light"] as const).map((t) => (
            <button
              key={t}
              onClick={() => save({ ...s, theme: t })}
              className={`p-3 rounded-md border text-left transition-colors ${
                s.theme === t ? "border-primary/50 bg-primary/15" : "border-border/60 hover:border-border"
              }`}
            >
              <div className="font-medium capitalize">{t}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {t === "dark" ? "Research dashboard (default)" : "Light mode"}
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileImage className="h-4 w-4 text-primary" /> Output Format
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 text-sm">
          {(["PNG", "JPG"] as const).map((f) => (
            <button
              key={f}
              onClick={() => save({ ...s, outputFormat: f })}
              className={`p-3 rounded-md border text-left transition-colors ${
                s.outputFormat === f ? "border-primary/50 bg-primary/15" : "border-border/60 hover:border-border"
              }`}
            >
              <div className="font-medium">{f}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {f === "PNG" ? "Lossless quality, larger files" : "Smaller files, lossy"}
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Gauge className="h-4 w-4 text-primary" /> Restoration Strength Default
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <input
            type="range"
            min={0}
            max={100}
            value={s.sliderDefault}
            onChange={(e) => save({ ...s, sliderDefault: parseInt(e.target.value) })}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground font-mono">
            <span>Mild</span>
            <span>{s.sliderDefault}%</span>
            <span>Full VisionX</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="h-4 w-4 text-primary" /> Comparison Default
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 text-sm">
          {(["slider", "side"] as const).map((m) => (
            <button
              key={m}
              onClick={() => save({ ...s, comparisonMode: m })}
              className={`p-3 rounded-md border text-left transition-colors ${
                s.comparisonMode === m ? "border-primary/50 bg-primary/15" : "border-border/60 hover:border-border"
              }`}
            >
              <div className="font-medium capitalize">{m === "side" ? "Side-by-side" : "Slider"}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {m === "side" ? "Two images side by side" : "Interactive before/after slider"}
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" /> Model Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Channels, num_blocks, num_heads, architecture, weights, and DWT
            implementation are <span className="text-foreground/90">locked</span>{" "}
            for compatibility with the trained checkpoint (`best_model_new.pth`). These values
            cannot be changed from the UI.
          </p>
          <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
            <div className="rounded-md border border-border/60 bg-card/40 p-2">
              <div className="text-muted-foreground">channels</div>
              <div className="font-mono">64</div>
            </div>
            <div className="rounded-md border border-border/60 bg-card/40 p-2">
              <div className="text-muted-foreground">num_blocks</div>
              <div className="font-mono">12</div>
            </div>
            <div className="rounded-md border border-border/60 bg-card/40 p-2">
              <div className="text-muted-foreground">num_heads</div>
              <div className="font-mono">8</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}