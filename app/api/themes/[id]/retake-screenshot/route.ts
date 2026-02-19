import { NextRequest, NextResponse } from "next/server";
import { getThemeById, updateTheme } from "@/lib/store";
import { buildHostedUrlNode, buildNuveiParams } from "@/lib/nuvei-params";
import { captureScreenshot } from "@/lib/capture-screenshot";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const theme = getThemeById(id);
  if (!theme) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const merchantId = (process.env.NUVEI_MERCHANT_ID ?? "").trim().replace(/\r?\n/g, "");
  const merchantSiteId = (process.env.NUVEI_MERCHANT_SITE_ID ?? "").trim().replace(/\r?\n/g, "");
  const secretKey = (process.env.NUVEI_SECRET_KEY ?? "").trim().replace(/\r?\n/g, "");
  if (!merchantId || !merchantSiteId || !secretKey) {
    return NextResponse.json(
      { error: "Demo credentials not configured for screenshot" },
      { status: 503 }
    );
  }

  const url = buildHostedUrlNode(
    buildNuveiParams({
      merchant_id: merchantId,
      merchant_site_id: merchantSiteId,
      user_token_id: "demo@nuvei.local",
      theme_id: theme.theme_id,
    }),
    secretKey
  );

  try {
    const { base64, publicPath } = await captureScreenshot(url);
    const updated = updateTheme(id, {
      screenshot_base64: base64,
      screenshot_path: publicPath ?? null,
    });
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Retake screenshot failed:", err);
    return NextResponse.json(
      { error: `Screenshot failed: ${message}` },
      { status: 500 }
    );
  }
}
