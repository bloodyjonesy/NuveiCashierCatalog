/**
 * Extract a small color palette from a screenshot (base64). Pure JS implementation
 * using pngjs + inline quantize so it works in Docker/Railway without external deps or bundling issues.
 */
const COLOR_COUNT = 5;
const QUALITY = 10; // sample every Nth pixel

/** Inline simple quantize: bucket colors, take top N by frequency. No external package = no bundle issues. */
function quantizePalette(pixels: [number, number, number][], maxColors: number): [number, number, number][] {
  if (pixels.length === 0 || maxColors < 1) return [];
  const BITS = 4; // 4 bits per channel => 16^3 buckets
  const shift = 8 - BITS;
  const bucket = (r: number, g: number, b: number) =>
    (r >> shift) * 256 * 256 + (g >> shift) * 256 + (b >> shift);
  const sum: Record<number, { n: number; r: number; g: number; b: number }> = {};
  for (const [r, g, b] of pixels) {
    const key = bucket(r, g, b);
    if (!sum[key]) sum[key] = { n: 0, r: 0, g: 0, b: 0 };
    sum[key].n++;
    sum[key].r += r;
    sum[key].g += g;
    sum[key].b += b;
  }
  const byCount = Object.entries(sum)
    .map(([, v]) => ({ n: v.n, r: Math.round(v.r / v.n), g: Math.round(v.g / v.n), b: Math.round(v.b / v.n) }))
    .sort((a, b) => b.n - a.n);
  return byCount.slice(0, maxColors).map((c) => [c.r, c.g, c.b] as [number, number, number]);
}

export type PaletteDebug = {
  step: string;
  bufferLength?: number;
  firstBytes?: string;
  width?: number;
  height?: number;
  dataLength?: number;
  pixelArrayLength?: number;
  hasCmap?: boolean;
  paletteLength?: number;
  error?: string;
  palette?: string[];
};

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, "0")).join("");
}

function buildPixelArray(data: Buffer | Uint8Array, width: number, height: number): [number, number, number][] {
  const pixelArray: [number, number, number][] = [];
  const pixelCount = width * height;
  for (let i = 0; i < pixelCount; i += QUALITY) {
    const offset = i * 4;
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];
    const a = data[offset + 3];
    // Skip only very transparent; include near-white so mostly-white screenshots still get a palette
    if (typeof a === "undefined" || a >= 64) {
      pixelArray.push([r, g, b]);
    }
  }
  return pixelArray;
}

export async function extractPaletteFromBase64(
  base64Image: string,
  debugCollect?: (d: PaletteDebug) => void
): Promise<string[]> {
  const push = (d: PaletteDebug) => {
    console.log("[color-palette]", d.step, d);
    debugCollect?.(d);
  };

  if (!base64Image?.trim()) {
    push({ step: "skip", error: "empty base64Image" });
    return [];
  }
  const normalized = base64Image.replace(/^data:image\/\w+;base64,/, "").trim();
  if (!normalized) {
    push({ step: "skip", error: "normalized empty" });
    return [];
  }
  try {
    const buffer = Buffer.from(normalized, "base64");
    push({
      step: "buffer",
      bufferLength: buffer.length,
      firstBytes: buffer.slice(0, 8).toString("hex"),
    });
    if (buffer.length === 0) {
      push({ step: "skip", error: "buffer empty", bufferLength: 0 });
      return [];
    }

    const PNG = require("pngjs").PNG;
    const png = PNG.sync.read(buffer);
    const hasData = !!(png?.data && png.width && png.height);
    push({
      step: "png_read",
      width: png?.width,
      height: png?.height,
      dataLength: png?.data?.length,
      error: hasData ? undefined : "missing data/width/height",
    });
    if (!hasData) return [];

    const pixelArray = buildPixelArray(png.data, png.width, png.height);
    push({ step: "pixel_array", pixelArrayLength: pixelArray.length });
    if (pixelArray.length < 2) {
      push({ step: "skip", error: "pixelArray too small", pixelArrayLength: pixelArray.length });
      return [];
    }

    const palette = quantizePalette(pixelArray, COLOR_COUNT);
    push({ step: "quantize", hasCmap: palette.length > 0 });
    if (palette.length === 0) return [];

    const isArray = Array.isArray(palette);
    push({ step: "palette", paletteLength: palette.length, error: isArray ? undefined : "not array" });
    if (!isArray) return [];

    const hexColors = palette.map(([r, g, b]) => rgbToHex(r, g, b));
    push({ step: "done", palette: hexColors });
    return hexColors;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    push({ step: "throw", error: msg });
    console.error("[color-palette] extractPaletteFromBase64 failed:", err);
    return [];
  }
}
