import { NextRequest, NextResponse } from "next/server";
import { addDmn, getRecentDmns } from "@/lib/dmn-store";

/**
 * DMN endpoint for Nuvei. Configure this URL in your Nuvei account (e.g. notify_url / DMN URL).
 * POST: receives DMN payload, stores it for display on the view page, returns 200.
 * GET: returns recent DMNs (for the view page).
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let data: Record<string, unknown>;
    if (contentType.includes("application/json")) {
      const body = await request.json().catch(() => ({}));
      data = typeof body === "object" && body !== null ? body : { raw: body };
    } else {
      const text = await request.text();
      const params = new URLSearchParams(text);
      data = Object.fromEntries(params.entries());
    }
    addDmn(data);
  } catch {
    // store anyway so we don't break Nuvei retries
    addDmn({ _error: "parse_failed" });
  }
  return new NextResponse("OK", { status: 200 });
}

export async function GET() {
  const dmns = getRecentDmns();
  return NextResponse.json(dmns);
}
