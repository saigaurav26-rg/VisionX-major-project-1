import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/backend-proxy";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const qs = sp.toString();
  return proxyToBackend("GET", `/api/blend${qs ? "?" + qs : ""}`);
}