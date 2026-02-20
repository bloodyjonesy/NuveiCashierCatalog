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
  const log = (msg: string, ...args: unknown[]) =>
    console.log("[color-palette]", msg, ...args);

  if (!base64Image?.trim()) {
    log("skip: empty base64Image");
    return [];
  }
  const normalized = base64Image.replace(/^data:image\/\w+;base64,/, "").trim();
  if (!normalized) {
    log("skip: normalized empty");
    return [];
  }
  try {
    const buffer = Buffer.from(normalized, "base64");
    log("step 1: buffer length", buffer.length, "firstBytes", buffer.slice(0, 8).toString("hex"));
    if (buffer.length === 0) {
      log("skip: buffer empty");
      return [];
    }

    const PNG = require("pngjs").PNG;
    const png = PNG.sync.read(buffer);
    const hasData = !!(png?.data && png.width && png.height);
    log("step 2: PNG read", {
      hasPng: !!png,
      width: png?.width,
      height: png?.height,
      dataLength: png?.data?.length,
      hasData,
    });
    if (!hasData) {
      log("skip: invalid png (missing data/width/height)");
      return [];
    }

    const pixelArray = buildPixelArray(png.data, png.width, png.height);
    log("step 3: pixelArray length", pixelArray.length);
    if (pixelArray.length < 2) {
      log("skip: pixelArray too small (need at least 2)");
      return [];
    }

    const quantize = require("@lokesh.dhakar/quantize");
    const cmap = quantize(pixelArray, COLOR_COUNT);
    log("step 4: quantize result", { hasCmap: !!cmap });
    if (!cmap) {
      log("skip: quantize returned falsy");
      return [];
    }

    const palette = cmap.palette();
    const isArray = Array.isArray(palette);
    log("step 5: palette", { isArray, length: palette?.length });
    if (!isArray) {
      log("skip: palette not array");
      return [];
    }

    const hexColors = palette.map(([r, g, b]: number[]) => rgbToHex(r, g, b));
    log("step 6: done", hexColors);
    return hexColors;
  } catch (err) {
    console.error("[color-palette] extractPaletteFromBase64 failed:", err);
    return [];
  }
}
