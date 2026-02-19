import { NextRequest, NextResponse } from "next/server";
import { getAllThemes, createTheme } from "@/lib/store";

export async function GET() {
  const themes = getAllThemes();
  return NextResponse.json(themes);
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

  const theme = createTheme({
    theme_id: theme_id.trim(),
    name: name.trim(),
    screenshot_path,
    screenshot_base64,
  });
  return NextResponse.json(theme);
}
