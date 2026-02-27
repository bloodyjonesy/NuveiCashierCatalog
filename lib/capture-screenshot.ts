import path from "path";
import fs from "fs";

const THEMES_DIR = path.join(process.cwd(), "public", "themes");

function ensureThemesDir() {
  if (!fs.existsSync(THEMES_DIR)) {
    fs.mkdirSync(THEMES_DIR, { recursive: true });
  }
}

function safeFilename(): string {
  return `screenshot-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.png`;
}

const DESKTOP_VIEWPORT = { width: 1600, height: 1000 };
/** Standard mobile resolution (e.g. iPhone SE / small phone) */
const MOBILE_VIEWPORT = { width: 375, height: 667 };

export type ScreenshotDeviceType = "desktop" | "mobile";

/**
 * Capture a screenshot of the given URL. Optionally write to public/themes and return public path.
 * Use device_type to capture at desktop (1600×1000) or mobile (375×667) viewport.
 */
export async function captureScreenshot(
  url: string,
  device_type: ScreenshotDeviceType = "desktop"
): Promise<{
  base64: string;
  path?: string;
  publicPath?: string;
}> {
  const viewport = device_type === "mobile" ? MOBILE_VIEWPORT : DESKTOP_VIEWPORT;
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewportSize(viewport);
  await page.goto(url, { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(2000);

  // Get screenshot as buffer first so we always have base64 (works when public/ is read-only e.g. Railway)
  const buffer = await page.screenshot({ fullPage: false });
  const base64 = Buffer.isBuffer(buffer) ? buffer.toString("base64") : "";
  let publicPath: string | undefined;
  const filename = safeFilename();
  const filePath = path.join(THEMES_DIR, filename);
  try {
    ensureThemesDir();
    fs.writeFileSync(filePath, buffer);
    publicPath = `/themes/${filename}`;
  } catch (writeErr) {
    console.warn("[capture-screenshot] could not write file (read-only fs?):", writeErr);
  }
  console.log("[capture-screenshot] bufferLength=" + (Buffer.isBuffer(buffer) ? buffer.length : 0), {
    base64Length: base64.length,
    publicPath: publicPath ?? null,
  });
  await browser.close();
  return { base64, path: filePath, publicPath };
}
