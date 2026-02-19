/**
 * Extract a small color palette from a screenshot (base64). Used when saving a theme.
 */
const COLOR_COUNT = 5;

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

export async function extractPaletteFromBase64(base64Image: string): Promise<string[]> {
  if (!base64Image?.trim()) return [];
  const normalized = base64Image.replace(/^data:image\/\w+;base64,/, "").trim();
  if (!normalized) return [];
  try {
    const { getPalette } = await import("colorthief");
    const buffer = Buffer.from(normalized, "base64");
    if (buffer.length === 0) return [];
    const palette = await getPalette(buffer, COLOR_COUNT);
    if (!Array.isArray(palette)) return [];
    return palette.map(([r, g, b]: number[]) => rgbToHex(r, g, b));
  } catch (err) {
    console.error("[color-palette] extractPaletteFromBase64 failed:", err);
    return [];
  }
}
