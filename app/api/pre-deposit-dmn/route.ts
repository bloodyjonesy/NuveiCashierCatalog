import { NextRequest, NextResponse } from "next/server";
import { getPreDepositConfig } from "@/lib/pre-deposit-config";
import { addDmn } from "@/lib/dmn-store";

/**
 * Pre-deposit DMN endpoint. Configure this URL in your Nuvei account for pre-deposit DMNs.
 * Response: action=APPROVE or action=DECLINE (optional message=...).
 */
export async function POST(request: NextRequest) {
  let data: Record<string, unknown> = {};
  try {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await request.json().catch(() => ({}));
      data = typeof body === "object" && body !== null ? body : {};
    } else {
      const text = await request.text();
      const params = new URLSearchParams(text);
      data = Object.fromEntries(params.entries());
    }
  } catch {
    // continue
  }

  const { mode, declineMessage } = getPreDepositConfig();

  let responseBody: string;
  if (mode === "always_accept") {
    responseBody = "action=APPROVE";
  } else if (mode === "decline_with_message" && declineMessage) {
    responseBody = `action=DECLINE&message=${declineMessage}`;
  } else {
    responseBody = "action=DECLINE";
  }

  addDmn({
    ...data,
    _source: "pre_deposit",
    _responseToNuvei: responseBody,
  });

  if (mode === "always_accept") {
    return new NextResponse(responseBody, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return new NextResponse(responseBody, {
    status: 200,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
}
