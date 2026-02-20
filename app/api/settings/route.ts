import { NextRequest, NextResponse } from "next/server";
import { getDefaultThemeId, setDefaultThemeId } from "@/lib/store";

export async function GET() {
  const default_theme_id = await getDefaultThemeId();
  return NextResponse.json({ default_theme_id });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const themeId =
    typeof body.default_theme_id === "string"
      ? body.default_theme_id.trim()
      : null;
  await setDefaultThemeId(themeId || null);
  return NextResponse.json({
    default_theme_id: themeId || null,
  });
}
