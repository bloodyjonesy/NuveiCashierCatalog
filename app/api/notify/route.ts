import { NextRequest, NextResponse } from "next/server";

/**
 * Echo endpoint for Nuvei payment page notify_url.
 * Logs the payload and returns 200 so Nuvei accepts the notification.
 * For production you would validate and process the notification.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const contentType = request.headers.get("content-type") || "";
    let data: unknown = body;
    if (contentType.includes("application/json")) {
      try {
        data = JSON.parse(body);
      } catch {
        // keep as string
      }
    }
    if (process.env.NODE_ENV !== "test") {
      console.log("[Nuvei notify]", data);
    }
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
