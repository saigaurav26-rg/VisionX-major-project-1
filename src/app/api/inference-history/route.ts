import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/backend-proxy";

export async function GET(_req: NextRequest) {
  return proxyToBackend("GET", "/api/inference-history");
}