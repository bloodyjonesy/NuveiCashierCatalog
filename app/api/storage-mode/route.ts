import { NextResponse } from "next/server";
import { useDatabase } from "@/lib/db";

/**
 * Diagnostic: where themes are saved and read from.
 * GET /api/storage-mode — no secrets, only whether DB is used and which env vars are set.
 */
export async function GET() {
  const databaseUrlSet = Boolean(process.env.DATABASE_URL?.trim());
  const databasePrivateUrlSet = Boolean(process.env.DATABASE_PRIVATE_URL?.trim());
  const databasePublicUrlSet = Boolean(process.env.DATABASE_PUBLIC_URL?.trim());
  const useDb = useDatabase();

  return NextResponse.json({
    mode: useDb ? "database" : "file",
    message: useDb
      ? "Themes are saved to and read from PostgreSQL."
      : "Themes are saved to and read from data/themes.json (file). Set DATABASE_URL, DATABASE_PRIVATE_URL, or DATABASE_PUBLIC_URL to use Postgres.",
    databaseUrlSet,
    databasePrivateUrlSet,
    databasePublicUrlSet,
    note: "If mode is 'file' on Railway, add a variable from your Postgres service: Variables → New variable → e.g. DATABASE_URL = ${{Postgres.DATABASE_URL}} (or DATABASE_PRIVATE_URL / DATABASE_PUBLIC_URL depending on what your Postgres service exposes).",
  });
}
