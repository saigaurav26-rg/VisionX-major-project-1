"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchHistory, deleteHistory, fmtMs, imageUrl, HistoryEntry } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Download, ExternalLink, History as HistoryIcon, ArrowRight } from "lucide-react";

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchHistory();
      setEntries(res.entries || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onDelete = async (id: string) => {
    await deleteHistory(id);
    load();
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 lg:px-8 py-8 lg:py-12 space-y-6">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Inference Log</div>
          <h1 className="text-3xl font-semibold tracking-tight mt-1">Inference History</h1>
          <p className="text-sm text-muted-foreground mt-1">Recent VisionX inference results stored locally.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/app">New inference <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
        </Button>
      </header>

      {loading && <div className="text-sm text-muted-foreground">Loading…</div>}

      {!loading && entries.length === 0 && (
        <Card className="border-border/60 bg-card/30">
          <CardContent className="p-8 text-center text-muted-foreground">
            <HistoryIcon className="h-8 w-8 mx-auto opacity-50" />
            <div className="mt-3 text-foreground/90">No inference history yet.</div>
            <p className="text-xs mt-1">Upload and process an image to see results here.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {entries.map((e) => (
          <Card key={e.id} className="border-border/60 bg-card/30 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm truncate">{e.filename}</CardTitle>
              <div className="text-[11px] text-muted-foreground font-mono">
                {new Date(e.ts * 1000).toLocaleString()}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <Stat label="Input" value={`${e.input_w} × ${e.input_h}`} />
                <Stat label="Output" value={`${e.output_w} × ${e.output_h}`} />
                <Stat label="Device" value={e.device} />
                <Stat label="Time" value={fmtMs(e.processing_ms)} />
                <Stat label="Model" value={`VisionX v${e.model_version}`} />
                <Stat label="ID" value={e.id} />
              </div>
              <div className="flex gap-1.5">
                <Button asChild size="sm" variant="outline" className="flex-1">
                  <a href={imageUrl(e.output_path.split("/").pop() || "")} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-3.5 w-3.5 mr-1" /> Open
                  </a>
                </Button>
                <Button asChild size="sm" className="flex-1">
                  <a href={imageUrl(e.output_path.split("/").pop() || "")} download={`${e.filename}_derained.png`}>
                    <Download className="h-3.5 w-3.5 mr-1" /> Download
                  </a>
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onDelete(e.id)} aria-label="Delete">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-mono mt-0.5 truncate">{value}</div>
    </div>
  );
}