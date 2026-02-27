import { NextRequest, NextResponse } from "next/server";
import { getThemeById, updateTheme, deleteTheme } from "@/lib/store";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const theme = await getThemeById(id);
  if (!theme) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(theme);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const updates: {
    name?: string;
    theme_id?: string;
    screenshot_path?: string | null;
    screenshot_base64?: string | null;
    custom_css?: string | null;
    device_type?: "desktop" | "mobile";
  } = {};
  if (typeof body.name === "string") updates.name = body.name;
  if (typeof body.theme_id === "string") updates.theme_id = body.theme_id;
  if (body.screenshot_path !== undefined) updates.screenshot_path = body.screenshot_path ?? null;
  if (body.screenshot_base64 !== undefined) updates.screenshot_base64 = body.screenshot_base64 ?? null;
  if (body.custom_css !== undefined) updates.custom_css = typeof body.custom_css === "string" ? body.custom_css : null;
  if (body.device_type === "mobile" || body.device_type === "desktop") updates.device_type = body.device_type;

  const theme = await updateTheme(id, updates);
  if (!theme) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(theme);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ok = await deleteTheme(id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
