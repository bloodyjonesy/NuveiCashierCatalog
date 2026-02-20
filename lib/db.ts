/**
 * PostgreSQL theme catalog. Used when DATABASE_URL is set (e.g. Railway Postgres).
 * Table: theme_id, name, screenshot_path (link), screenshot_base64 (optional thumbnail).
 */
import { Pool } from "pg";
import type { ThemeRecord } from "./types";

let pool: Pool | null = null;
let schemaInited = false;

// Read with bracket notation so env is read at runtime (not inlined at build)
function getEnv(key: string): string {
  return (process.env[key] ?? "").trim();
}

function getConnectionString(): string {
  const url =
    getEnv("DATABASE_URL") ||
    getEnv("DATABASE_PRIVATE_URL") ||
    getEnv("DATABASE_PUBLIC_URL") ||
    getEnv("POSTGRES_URL") ||
    getEnv("POSTGRES_PRIVATE_URL") ||
    "";
  if (!url) throw new Error("One of DATABASE_URL, DATABASE_PRIVATE_URL, DATABASE_PUBLIC_URL, POSTGRES_URL, POSTGRES_PRIVATE_URL is required for database mode");
  return url;
}

function getPool(): Pool {
  if (!pool) {
    const url = getConnectionString();
    pool = new Pool({
      connectionString: url,
      ssl: url.includes("localhost") ? false : { rejectUnauthorized: false },
    });
  }
  return pool;
}

async function ensureSchema(): Promise<void> {
  if (schemaInited) return;
  await initThemesTable();
  schemaInited = true;
}

const TABLE = "themes";

export async function initThemesTable(): Promise<void> {
  const p = getPool();
  await p.query(`
    CREATE TABLE IF NOT EXISTS ${TABLE} (
      id TEXT PRIMARY KEY,
      theme_id TEXT NOT NULL,
      name TEXT NOT NULL,
      screenshot_path TEXT,
      screenshot_base64 TEXT,
      color_palette TEXT
    )
  `);
  await p.query(
    `ALTER TABLE ${TABLE} ADD COLUMN IF NOT EXISTS color_palette TEXT`
  );
  await p.query(
    `ALTER TABLE ${TABLE} ADD COLUMN IF NOT EXISTS custom_css TEXT`
  );
  await p.query(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);
}

const SETTINGS_TABLE = "settings";

export async function dbGetSetting(key: string): Promise<string | null> {
  await ensureSchema();
  const p = getPool();
  const res = await p.query(`SELECT value FROM ${SETTINGS_TABLE} WHERE key = $1`, [key]);
  const r = res.rows[0];
  return r?.value ?? null;
}

export async function dbSetSetting(key: string, value: string): Promise<void> {
  await ensureSchema();
  const p = getPool();
  await p.query(
    `INSERT INTO ${SETTINGS_TABLE} (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2`,
    [key, value]
  );
}

export async function dbGetThemeByThemeId(themeId: string): Promise<ThemeRecord | undefined> {
  await ensureSchema();
  const needle = themeId.trim();
  if (!needle) return undefined;
  const p = getPool();
  const res = await p.query(
    `SELECT id, theme_id, name, screenshot_path, screenshot_base64, color_palette, custom_css FROM ${TABLE} WHERE TRIM(theme_id) = $1 LIMIT 1`,
    [needle]
  );
  const r = res.rows[0];
  if (!r) return undefined;
  return {
    id: r.id,
    theme_id: r.theme_id,
    name: r.name,
    screenshot_path: r.screenshot_path ?? null,
    screenshot_base64: r.screenshot_base64 ?? null,
    color_palette: parseColorPalette(r.color_palette),
    custom_css: r.custom_css ?? null,
  };
}

export async function dbGetAllThemes(): Promise<ThemeRecord[]> {
  await ensureSchema();
  const p = getPool();
  const res = await p.query(
    `SELECT id, theme_id, name, screenshot_path, screenshot_base64, color_palette, custom_css FROM ${TABLE} ORDER BY name`
  );
  return res.rows.map((r) => ({
    id: r.id,
    theme_id: r.theme_id,
    name: r.name,
    screenshot_path: r.screenshot_path ?? null,
    screenshot_base64: r.screenshot_base64 ?? null,
    color_palette: parseColorPalette(r.color_palette),
    custom_css: r.custom_css ?? null,
  }));
}

function parseColorPalette(raw: unknown): string[] | null {
  if (raw == null || raw === "") return null;
  try {
    const arr = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(arr) ? arr : null;
  } catch {
    return null;
  }
}

export async function dbGetThemeById(id: string): Promise<ThemeRecord | undefined> {
  await ensureSchema();
  const p = getPool();
  const res = await p.query(
    `SELECT id, theme_id, name, screenshot_path, screenshot_base64, color_palette, custom_css FROM ${TABLE} WHERE id = $1`,
    [id]
  );
  const r = res.rows[0];
  if (!r) return undefined;
  return {
    id: r.id,
    theme_id: r.theme_id,
    name: r.name,
    screenshot_path: r.screenshot_path ?? null,
    screenshot_base64: r.screenshot_base64 ?? null,
    color_palette: parseColorPalette(r.color_palette),
    custom_css: r.custom_css ?? null,
  };
}

export async function dbCreateTheme(
  input: Omit<ThemeRecord, "id"> & { id?: string }
): Promise<ThemeRecord> {
  await ensureSchema();
  const id = input.id ?? generateId();
  const p = getPool();
  await p.query(
    `INSERT INTO ${TABLE} (id, theme_id, name, screenshot_path, screenshot_base64, color_palette, custom_css) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      id,
      input.theme_id,
      input.name,
      input.screenshot_path ?? null,
      input.screenshot_base64 ?? null,
      input.color_palette != null ? JSON.stringify(input.color_palette) : null,
      input.custom_css ?? null,
    ]
  );
  return {
    id,
    theme_id: input.theme_id,
    name: input.name,
    screenshot_path: input.screenshot_path ?? null,
    screenshot_base64: input.screenshot_base64 ?? null,
    color_palette: input.color_palette ?? null,
    custom_css: input.custom_css ?? null,
  };
}

export async function dbUpdateTheme(
  id: string,
  updates: Partial<Pick<ThemeRecord, "name" | "theme_id" | "screenshot_path" | "screenshot_base64" | "color_palette" | "custom_css">>
): Promise<ThemeRecord | undefined> {
  await ensureSchema();
  const current = await dbGetThemeById(id);
  if (!current) return undefined;
  const merged = { ...current, ...updates };
  const p = getPool();
  await p.query(
    `UPDATE ${TABLE} SET theme_id = $1, name = $2, screenshot_path = $3, screenshot_base64 = $4, color_palette = $5, custom_css = $6 WHERE id = $7`,
    [
      merged.theme_id,
      merged.name,
      merged.screenshot_path ?? null,
      merged.screenshot_base64 ?? null,
      merged.color_palette != null ? JSON.stringify(merged.color_palette) : null,
      merged.custom_css ?? null,
      id,
    ]
  );
  return merged;
}

export async function dbDeleteTheme(id: string): Promise<boolean> {
  await ensureSchema();
  const p = getPool();
  const res = await p.query(`DELETE FROM ${TABLE} WHERE id = $1`, [id]);
  return (res.rowCount ?? 0) > 0;
}

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function useDatabase(): boolean {
  return Boolean(
    getEnv("DATABASE_URL") ||
      getEnv("DATABASE_PRIVATE_URL") ||
      getEnv("DATABASE_PUBLIC_URL") ||
      getEnv("POSTGRES_URL") ||
      getEnv("POSTGRES_PRIVATE_URL")
  );
}
