import { NextRequest } from "next/server";

const BACKEND = process.env.VISIONX_BACKEND_URL || "http://127.0.0.1:8000";

export async function proxyToBackend(
  method: string,
  path: string,
  req?: NextRequest
): Promise<Response> {
  const url = `${BACKEND}${path}`;
  const init: RequestInit = { method };
  if (req) {
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("multipart/form-data")) {
      init.body = req.body as any;
      init.headers = { "content-type": ct };
      (init as any).duplex = "half";
    } else {
      const text = await req.text();
      if (text) {
        init.body = text;
        init.headers = { "content-type": ct };
      }
    }
  }
  try {
    const res = await fetch(url, init);
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: {
        "content-type": res.headers.get("content-type") || "application/json",
      },
    });
  } catch (e: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: `VisionX backend unreachable: ${e?.message || e}`,
      }),
      {
        status: 502,
        headers: { "content-type": "application/json" },
      }
    );
  }
}