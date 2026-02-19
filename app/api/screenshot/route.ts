import { NextRequest, NextResponse } from "next/server";
import { buildHostedUrlNode, buildNuveiParams } from "@/lib/nuvei-params";
import { captureScreenshot } from "@/lib/capture-screenshot";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  let url: string | null = null;

  const isNuveiUrl =
    typeof body.url === "string" &&
    (body.url.startsWith("https://secure.nuvei.com/") ||
      body.url.startsWith("https://ppp-test.safecharge.com/"));
  if (isNuveiUrl) {
    url = body.url;
  } else if (body.useDemo === true && typeof body.theme_id === "string") {
    const merchantId = (process.env.NUVEI_MERCHANT_ID ?? "").trim().replace(/\r?\n/g, "");
    const merchantSiteId = (process.env.NUVEI_MERCHANT_SITE_ID ?? "").trim().replace(/\r?\n/g, "");
    const secretKey = (process.env.NUVEI_SECRET_KEY ?? "").trim().replace(/\r?\n/g, "");
    if (!merchantId || !merchantSiteId || !secretKey) {
      return NextResponse.json(
        { error: "Demo credentials not configured" },
        { status: 503 }
      );
    }
    url = buildHostedUrlNode(
      buildNuveiParams({
        merchant_id: merchantId,
        merchant_site_id: merchantSiteId,
        user_token_id: "demo@nuvei.local",
        theme_id: body.theme_id.trim(),
      }),
      secretKey
    );
  }

  if (!url) {
    return NextResponse.json(
      { error: "Provide url (Nuvei hosted page) or useDemo + theme_id" },
      { status: 400 }
    );
  }

  try {
    const { base64, publicPath } = await captureScreenshot(url);
    return NextResponse.json({ path: publicPath ?? null, base64 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Screenshot failed:", err);
    const hint =
      message.includes("Executable") || message.includes("browserType")
        ? " Install Chromium in the build step: npx playwright install chromium (or add Chromium to your deploy config)."
        : "";
    return NextResponse.json(
      { error: `Screenshot failed: ${message}${hint}` },
      { status: 500 }
    );
  }
}
