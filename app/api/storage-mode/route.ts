import { NextResponse } from "next/server";
import { useDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Diagnostic: where themes are saved and read from.
 * GET /api/storage-mode — no secrets; returns lengths so you can see if vars are present at runtime.
 */
export async function GET() {
  // Read at runtime (bracket notation to avoid any build-time inlining)
  const env = (key: string) => (process.env[key] ?? "").trim();
  const len = (key: string) => env(key).length;

  const vars = {
    DATABASE_URL: len("DATABASE_URL"),
    DATABASE_PRIVATE_URL: len("DATABASE_PRIVATE_URL"),
    DATABASE_PUBLIC_URL: len("DATABASE_PUBLIC_URL"),
    POSTGRES_URL: len("POSTGRES_URL"),
    POSTGRES_PRIVATE_URL: len("POSTGRES_PRIVATE_URL"),
  };
  const useDb = useDatabase();

  const anySet = Object.values(vars).some((n) => n > 0);
  let note = "";
  if (!useDb && !anySet) {
    note =
      "No DB env vars are set at runtime. On Railway: open your app service → Variables → ensure a variable is set (e.g. DATABASE_URL) and its value is a Reference to the Postgres service (e.g. ${{Postgres.DATABASE_URL}}). Service name must match exactly. Then redeploy.";
  } else if (!useDb && anySet) {
    note =
      "DB vars have length > 0 but app is still using file. Check that the variable name is one we support: DATABASE_URL, DATABASE_PRIVATE_URL, DATABASE_PUBLIC_URL, POSTGRES_URL, POSTGRES_PRIVATE_URL.";
  } else {
    note = "Using PostgreSQL for theme storage.";
  }

  return NextResponse.json({
    mode: useDb ? "database" : "file",
    message: useDb
      ? "Themes are saved to and read from PostgreSQL."
      : "Themes are saved to and read from data/themes.json (file).",
    envVarLengths: vars,
    note,
  });
}
