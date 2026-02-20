import { NextRequest, NextResponse } from "next/server";

const NUVEI_ORIGIN =
  (
    process.env.NUVEI_PPP_BASE_URL ??
    process.env.NEXT_PUBLIC_NUVEI_PPP_BASE_URL ??
    "https://ppp-test.safecharge.com/ppp/purchase.do"
  ).replace(/\/ppp\/purchase\.do.*/, "");

const SKIP_REQ_HEADERS = new Set([
  "host",
  "connection",
  "transfer-encoding",
  "keep-alive",
  "upgrade",
  "expect",
]);

const SKIP_RES_HEADERS = new Set([
  "content-encoding",
  "transfer-encoding",
  "connection",
  "keep-alive",
]);

async function proxyToNuvei(request: NextRequest, path: string) {
  const target = `${NUVEI_ORIGIN}/${path}`;
  const url = new URL(target);
  request.nextUrl.searchParams.forEach((v, k) => url.searchParams.append(k, v));

  console.log(`[nuvei-proxy] ${request.method} /${path} → ${url.toString()}`);

  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    if (!SKIP_REQ_HEADERS.has(key.toLowerCase())) {
      headers[key] = value;
    }
  });
  headers["host"] = new URL(NUVEI_ORIGIN).host;

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "follow",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    try {
      init.body = await request.arrayBuffer();
    } catch {
      // no body
    }
  }

  try {
    const upstream = await fetch(url.toString(), init);

    console.log(`[nuvei-proxy] /${path} → ${upstream.status} (${upstream.headers.get("content-type") ?? "?"})`);

    const resHeaders = new Headers();
    upstream.headers.forEach((value, key) => {
      if (!SKIP_RES_HEADERS.has(key.toLowerCase())) {
        resHeaders.set(key, value);
      }
    });
    resHeaders.set("Access-Control-Allow-Origin", "*");
    resHeaders.delete("content-security-policy");
    resHeaders.delete("x-frame-options");

    const body = await upstream.arrayBuffer();
    return new NextResponse(body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: resHeaders,
    });
  } catch (e) {
    console.error(`[nuvei-proxy] /${path} fetch error:`, e);
    return NextResponse.json(
      { error: "Proxy fetch failed" },
      { status: 502 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyToNuvei(request, path.join("/"));
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyToNuvei(request, path.join("/"));
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyToNuvei(request, path.join("/"));
}

export async function OPTIONS(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  void path;
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}
