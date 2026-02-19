import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { buildHostedUrlNode, buildNuveiParams, appendThemeType } from "@/lib/nuvei-params";

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
    const themeType = body.themeType === "SMARTPHONE" ? "SMARTPHONE" : "DESKTOP";
    url = buildHostedUrlNode(
      buildNuveiParams({
        merchant_id: merchantId,
        merchant_site_id: merchantSiteId,
        user_token_id: "demo@nuvei.local",
        theme_id: body.theme_id.trim(),
      }),
      secretKey,
      themeType
    );
  }

  if (!url) {
    return NextResponse.json(
      { error: "Provide url (Nuvei hosted page) or useDemo + theme_id" },
      { status: 400 }
    );
  }

  const themeType = body.themeType === "SMARTPHONE" ? "SMARTPHONE" : "DESKTOP";
  const viewport =
    themeType === "SMARTPHONE"
      ? { width: 390, height: 844 }
      : { width: 1600, height: 1000 };

  try {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize(viewport);
    const urlWithTheme = url.includes("themeType=") ? url : appendThemeType(url, themeType);
    await page.goto(urlWithTheme, { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForTimeout(2000);

    ensureThemesDir();
    const filename = safeFilename();
    const filePath = path.join(THEMES_DIR, filename);
    await page.screenshot({ path: filePath, fullPage: false });
    await browser.close();

    const publicPath = `/themes/${filename}`;
    return NextResponse.json({ path: publicPath });
  } catch (err) {
    console.error("Screenshot failed:", err);
    return NextResponse.json(
      { error: "Screenshot failed. Is Playwright installed? Run: npx playwright install chromium" },
      { status: 500 }
    );
  }
}
