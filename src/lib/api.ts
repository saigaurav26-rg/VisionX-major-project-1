"use client";

// Jab Localhost par chalaoge toh automatically localhost server le lega,
// Render deployment par environment variable se Render backend lega.



// Agar env variable blank pad gaya, toh default port 8000 target karo (localhost backend)
const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
).replace(/\/$/, "");

export const API = API_BASE;

export interface ModelInfo {
  ready: boolean;
  device: string;
  model_name: string;
  model_version: string;
  model_file: string;
  param_count: number;
  config: {
    in_channels: number;
    channels: number;
    num_blocks: number;
    num_heads: number;
  };
  components: string[];
  last_error?: string | null;
}

export interface InferenceResult {
  success: boolean;
  request_id: string;
  filename: string;
  original_image: string;
  derained_image: string;
  processing_time: number;
  model_name: string;
  model_version: string;
  device: string;
  input_width: number;
  input_height: number;
  output_width: number;
  output_height: number;
  metrics: Record<string, number | string>;
  download_filename: string;
  original_url?: string;
  derained_url?: string;
}

export interface HistoryEntry {
  id: string;
  ts: number;
  filename: string;
  input_w: number;
  input_h: number;
  output_w: number;
  output_h: number;
  processing_ms: number;
  device: string;
  model_version: string;
  output_path: string;
  original_path: string;
}

export async function fetchModelInfo(): Promise<ModelInfo> {
  const r = await fetch(`${API_BASE}/api/model-info`, { cache: "no-store" });
  return r.json();
}

export async function fetchHealth(): Promise<{ status: string; model_ready: boolean; device: string }> {
  const r = await fetch(`${API_BASE}/api/health`, { cache: "no-store" });
  return r.json();
}

export async function runInference(file: File): Promise<InferenceResult> {
  const fd = new FormData();
  fd.append("file", file);
  const r = await fetch(`${API_BASE}/api/inference`, { method: "POST", body: fd });
  if (!r.ok) {
    const err = await r.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || `Inference failed: ${r.status}`);
  }
  return r.json();
}

export async function runBatch(files: File[]): Promise<{ success: boolean; results: InferenceResult[] }> {
  const fd = new FormData();
  files.forEach((f) => fd.append("files", f));
  const r = await fetch(`${API_BASE}/api/inference/batch`, { method: "POST", body: fd });
  if (!r.ok) throw new Error(`Batch inference failed: ${r.status}`);
  return r.json();
}

export async function fetchHistory(): Promise<{ entries: HistoryEntry[] }> {
  const r = await fetch(`${API_BASE}/api/inference-history`, { cache: "no-store" });
  return r.json();
}

export async function deleteHistory(id: string): Promise<void> {
  await fetch(`${API_BASE}/api/inference-history/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function analyzeRestoration(file: File, derainedFile?: File): Promise<any> {
  const fd = new FormData();
  fd.append("file", file);
  if (derainedFile) fd.append("derained_file", derainedFile);
  const r = await fetch(`${API_BASE}/api/analyze/restoration`, { method: "POST", body: fd });
  if (!r.ok) throw new Error(`Restoration analysis failed: ${r.status}`);
  return r.json();
}

export async function analyzeXray(file: File, derainedFile?: File): Promise<any> {
  const fd = new FormData();
  fd.append("file", file);
  if (derainedFile) fd.append("derained_file", derainedFile);
  const r = await fetch(`${API_BASE}/api/analyze/xray`, { method: "POST", body: fd });
  if (!r.ok) throw new Error(`X-Ray analysis failed: ${r.status}`);
  return r.json();
}

export async function analyzeObjects(file: File, derainedFile?: File): Promise<any> {
  const fd = new FormData();
  fd.append("file", file);
  if (derainedFile) fd.append("derained_file", derainedFile);
  const r = await fetch(`${API_BASE}/api/analyze/objects`, { method: "POST", body: fd });
  if (!r.ok) throw new Error(`Object analysis failed: ${r.status}`);
  return r.json();
}

export async function askVisionAssistant(question: string, file: File, derainedFile?: File): Promise<any> {
  const fd = new FormData();
  fd.append("file", file);
  if (derainedFile) fd.append("derained_file", derainedFile);
  fd.append("question", question);
  const r = await fetch(`${API_BASE}/api/vision-assistant`, { method: "POST", body: fd });
  if (!r.ok) throw new Error(`Vision Assistant failed: ${r.status}`);
  return r.json();
}

export function blendUrl(originalName: string, derainedName: string, alpha: number): string {
  return `${API_BASE}/api/blend?original_id=${encodeURIComponent(originalName)}&derained_id=${encodeURIComponent(derainedName)}&alpha=${alpha}`;
}

export function imageUrl(filename: string): string {
  return `${API_BASE}/api/image/${encodeURIComponent(filename)}`;
}

export function fmtMs(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}