import { NextRequest, NextResponse } from "next/server";
import { addDmn } from "@/lib/dmn-store";

/**
 * Legacy notify endpoint. Also stores payload in DMN store for display on view page.
 * Prefer configuring Nuvei to use /api/dmn for the DMN URL (see Credentials → Integration URLs).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const contentType = request.headers.get("content-type") || "";
    let data: Record<string, unknown>;
    if (contentType.includes("application/json")) {
      try {
        const parsed = JSON.parse(body);
        data = typeof parsed === "object" && parsed !== null ? parsed : { raw: body };
      } catch {
        data = { raw: body };
      }
    } else {
      const params = new URLSearchParams(body);
      data = Object.fromEntries(params.entries());
    }
    addDmn(data);
  } catch {
    // ignore
  }
  return new NextResponse("OK", { status: 200 });
}

export async function GET() {
  return new NextResponse("Notify endpoint. Use POST for Nuvei callbacks.", {
    status: 200,
  });
}
