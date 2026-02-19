import { NextRequest, NextResponse } from "next/server";
import { buildHostedUrlNode } from "@/lib/nuvei-params";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const useDemo = body.useDemo === true;

  if (!useDemo) {
    return NextResponse.json(
      { error: "Only demo credentials are supported by this API" },
      { status: 400 }
    );
  }

  // Trim and strip newlines (Railway/env often adds trailing newlines when pasting)
  const merchantId = (process.env.NUVEI_MERCHANT_ID ?? "").trim().replace(/\r?\n/g, "");
  const merchantSiteId = (process.env.NUVEI_MERCHANT_SITE_ID ?? "").trim().replace(/\r?\n/g, "");
  const secretKey = (process.env.NUVEI_SECRET_KEY ?? "").trim().replace(/\r?\n/g, "");

  if (!merchantId || !merchantSiteId || !secretKey) {
    return NextResponse.json(
      { error: "Demo credentials not configured (NUVEI_* env vars)" },
      { status: 503 }
    );
  }

  const theme_id = typeof body.theme_id === "string" ? body.theme_id : undefined;
  const user_token_id =
    typeof body.user_token_id === "string" && body.user_token_id
      ? body.user_token_id
      : "demo@nuvei.local";
  const total_amount =
    typeof body.total_amount === "string" ? body.total_amount : "1.00";
  const currency = typeof body.currency === "string" ? body.currency : "USD";
  const themeType =
    body.themeType === "SMARTPHONE" ? "SMARTPHONE" : "DESKTOP";

  const url = buildHostedUrlNode(
    {
      merchant_id: merchantId,
      merchant_site_id: merchantSiteId,
      total_amount,
      currency,
      user_token_id,
      theme_id,
      item_amount_1: total_amount,
    },
    secretKey,
    themeType
  );

  return NextResponse.json({ url });
}
