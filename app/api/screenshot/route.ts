import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { buildHostedUrlNode, buildNuveiParams } from "@/lib/nuvei-params";

const THEMES_DIR = path.join(process.cwd(), "public", "themes");

function ensureThemesDir() {
  if (!fs.existsSync(THEMES_DIR)) {
    fs.mkdirSync(THEMES_DIR, { recursive: true });
  }
}

function safeFilename(): string {
  return `screenshot-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.png`;
}

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

  const viewport = { width: 1600, height: 1000 };

  try {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setViewportSize(viewport);
    await page.goto(url, { waitUntil: "networkidle", timeout: 20000 });
    await page.waitForTimeout(2000);

    ensureThemesDir();
    const filename = safeFilename();
    const filePath = path.join(THEMES_DIR, filename);
    await page.screenshot({ path: filePath, fullPage: false });
    await browser.close();

    const publicPath = `/themes/${filename}`;
    return NextResponse.json({ path: publicPath });
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
