/**
 * Extract a small color palette from a screenshot (base64). Pure JS implementation
 * using pngjs + quantize so it works in Docker/Railway without sharp native bindings.
 */
const COLOR_COUNT = 5;
const QUALITY = 10; // sample every Nth pixel

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

    const quantize = require("@lokesh.dhakar/quantize");
    const cmap = quantize(pixelArray, COLOR_COUNT);
    push({ step: "quantize", hasCmap: !!cmap });
    if (!cmap) return [];

    const palette = cmap.palette();
    const isArray = Array.isArray(palette);
    push({ step: "palette", paletteLength: palette?.length, error: isArray ? undefined : "not array" });
    if (!isArray) return [];

    const hexColors = palette.map(([r, g, b]: number[]) => rgbToHex(r, g, b));
    push({ step: "done", palette: hexColors });
    return hexColors;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    push({ step: "throw", error: msg });
    console.error("[color-palette] extractPaletteFromBase64 failed:", err);
    return [];
  }
}
