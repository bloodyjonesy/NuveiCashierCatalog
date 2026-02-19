import { NextRequest, NextResponse } from "next/server";
import { setPreDepositConfig, getPreDepositConfig } from "@/lib/pre-deposit-config";
import type { PreDepositMode } from "@/lib/pre-deposit-config";

export async function GET() {
  const config = getPreDepositConfig();
  return NextResponse.json(config);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const mode = body.mode as PreDepositMode | undefined;
  const declineMessage =
    typeof body.declineMessage === "string" ? body.declineMessage : undefined;
  if (
    mode &&
    ["always_accept", "decline_with_message", "decline_without_message"].includes(mode)
  ) {
    setPreDepositConfig({
      mode,
      ...(mode === "decline_with_message" && declineMessage !== undefined
        ? { declineMessage: declineMessage || "Your attempt has been declined." }
        : {}),
    });
  }
  const config = getPreDepositConfig();
  return NextResponse.json(config);
}
