import { NextRequest, NextResponse } from "next/server";
import {
  getDefaultThemeId,
  setDefaultThemeId,
  getDefaultThemeCustomCss,
  setDefaultThemeCustomCss,
} from "@/lib/store";

export async function GET() {
  const [default_theme_id, default_theme_custom_css] = await Promise.all([
    getDefaultThemeId(),
    getDefaultThemeCustomCss(),
  ]);
  return NextResponse.json({ default_theme_id, default_theme_custom_css });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  if (typeof body.default_theme_id === "string") {
    const themeId = body.default_theme_id.trim();
    await setDefaultThemeId(themeId || null);
  }
  if (typeof body.default_theme_custom_css === "string") {
    await setDefaultThemeCustomCss(body.default_theme_custom_css);
  }
  const [default_theme_id, default_theme_custom_css] = await Promise.all([
    getDefaultThemeId(),
    getDefaultThemeCustomCss(),
  ]);
  return NextResponse.json({ default_theme_id, default_theme_custom_css });
}
