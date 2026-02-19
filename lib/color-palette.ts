/**
 * Extract a small color palette from a screenshot (base64). Used when saving a theme.
 */
const COLOR_COUNT = 5;

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

export async function extractPaletteFromBase64(base64Image: string): Promise<string[]> {
  if (!base64Image?.trim()) return [];
  try {
    const ColorThief = require("colorthief");
    const buffer = Buffer.from(base64Image.replace(/^data:image\/\w+;base64,/, ""), "base64");
    const palette: [number, number, number][] = await ColorThief.getPalette(buffer, COLOR_COUNT);
    if (!Array.isArray(palette)) return [];
    return palette.map(([r, g, b]) => rgbToHex(r, g, b));
  } catch {
    return [];
  }
}
