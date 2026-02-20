/**
 * Extract a small color palette from a screenshot (base64). Pure JS implementation
 * using pngjs + quantize so it works in Docker/Railway without sharp native bindings.
 */
const COLOR_COUNT = 5;
const QUALITY = 10; // sample every Nth pixel (same idea as colorthief)

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, "0")).join("");
}

function buildPixelArray(data: Buffer, width: number, height: number): [number, number, number][] {
  const pixelArray: [number, number, number][] = [];
  const pixelCount = width * height;
  for (let i = 0; i < pixelCount; i += QUALITY) {
    const offset = i * 4;
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];
    const a = data[offset + 3];
    // Skip very transparent and near-white (same logic as colorthief)
    if ((typeof a === "undefined" || a >= 125) && !(r > 250 && g > 250 && b > 250)) {
      pixelArray.push([r, g, b]);
    }
  }
  return pixelArray;
}

export async function extractPaletteFromBase64(base64Image: string): Promise<string[]> {
  if (!base64Image?.trim()) return [];
  const normalized = base64Image.replace(/^data:image\/\w+;base64,/, "").trim();
  if (!normalized) return [];
  try {
    const buffer = Buffer.from(normalized, "base64");
    if (buffer.length === 0) return [];

    const PNG = require("pngjs").PNG;
    const png = PNG.sync.read(buffer);
    if (!png?.data || !png.width || !png.height) return [];

    const pixelArray = buildPixelArray(png.data, png.width, png.height);
    if (pixelArray.length < 2) return [];

    const quantize = require("@lokesh.dhakar/quantize");
    const cmap = quantize(pixelArray, COLOR_COUNT);
    if (!cmap) return [];

    const palette = cmap.palette();
    if (!Array.isArray(palette)) return [];

    return palette.map(([r, g, b]: number[]) => rgbToHex(r, g, b));
  } catch (err) {
    console.error("[color-palette] extractPaletteFromBase64 failed:", err);
    return [];
  }
}
