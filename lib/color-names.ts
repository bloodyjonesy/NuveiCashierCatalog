/**
 * Map a hex color to a broad color name (e.g. different shades of blue → "Blue").
 * Used for display and filtering; not exact, just good enough for catalog filters.
 */

export const COLOR_NAMES = [
  "Red",
  "Orange",
  "Yellow",
  "Green",
  "Cyan",
  "Blue",
  "Purple",
  "Pink",
  "White",
  "Gray",
  "Black",
] as const;

export type ColorName = (typeof COLOR_NAMES)[number];

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.replace(/^#/, "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return null;
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16),
  };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return { h: h * 360, s, l };
}

/**
 * Returns a broad color name for a hex color. Different shades map to the same name.
 */
export function getColorName(hex: string): ColorName {
  const rgb = hexToRgb(hex);
  if (!rgb) return "Gray";
  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);

  if (l >= 0.92) return "White";
  if (l <= 0.12) return "Black";
  if (s <= 0.08) return "Gray";

  // Hue: 0 = red, 120 = green, 240 = blue
  if (h < 15 || h >= 345) return "Red";
  if (h >= 15 && h < 45) return "Orange";
  if (h >= 45 && h < 75) return "Yellow";
  if (h >= 75 && h < 165) return "Green";
  if (h >= 165 && h < 195) return "Cyan";
  if (h >= 195 && h < 255) return "Blue";
  if (h >= 255 && h < 285) return "Purple";
  if (h >= 285 && h < 345) return "Pink";

  return "Gray";
}
