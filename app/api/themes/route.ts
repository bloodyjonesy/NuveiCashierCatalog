import { NextRequest, NextResponse } from "next/server";
import { getAllThemes, createTheme } from "@/lib/store";
import { extractPaletteFromBase64 } from "@/lib/color-palette";

export async function GET() {
  try {
    const themes = await getAllThemes();
    return NextResponse.json(themes);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[themes GET] getAllThemes failed:", message);
    return NextResponse.json(
      { error: "Failed to load themes", details: message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const theme_id = typeof body.theme_id === "string" ? body.theme_id : "";
  const name = typeof body.name === "string" ? body.name : "";
  const screenshot_path =
    typeof body.screenshot_path === "string" ? body.screenshot_path : null;
  const screenshot_base64 =
    typeof body.screenshot_base64 === "string" ? body.screenshot_base64 : null;

  if (!theme_id.trim() || !name.trim()) {
    return NextResponse.json(
      { error: "theme_id and name are required" },
      { status: 400 }
    );
  }

  try {
    const color_palette =
      screenshot_base64 != null
        ? await extractPaletteFromBase64(screenshot_base64)
        : undefined;
    const theme = await createTheme({
      theme_id: theme_id.trim(),
      name: name.trim(),
      screenshot_path,
      screenshot_base64,
      ...(color_palette != null && color_palette.length > 0 ? { color_palette } : {}),
    });
    return NextResponse.json(theme);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[themes POST] createTheme failed:", message);
    return NextResponse.json(
      { error: "Failed to save theme", details: message },
      { status: 500 }
    );
  }
}
