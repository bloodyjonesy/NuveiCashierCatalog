/**
 * PostgreSQL theme catalog. Used when DATABASE_URL is set (e.g. Railway Postgres).
 * Table: theme_id, name, screenshot_path (link), screenshot_base64 (optional thumbnail).
 */
import { Pool } from "pg";
import type { ThemeRecord } from "./types";

let pool: Pool | null = null;
let schemaInited = false;

function getConnectionString(): string {
  const url =
    process.env.DATABASE_URL?.trim() ||
    process.env.DATABASE_PRIVATE_URL?.trim() ||
    "";
  if (!url) throw new Error("DATABASE_URL or DATABASE_PRIVATE_URL is required for database mode");
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
      screenshot_base64 TEXT
    )
  `);
}

export async function dbGetAllThemes(): Promise<ThemeRecord[]> {
  await ensureSchema();
  const p = getPool();
  const res = await p.query(
    `SELECT id, theme_id, name, screenshot_path, screenshot_base64 FROM ${TABLE} ORDER BY name`
  );
  return res.rows.map((r) => ({
    id: r.id,
    theme_id: r.theme_id,
    name: r.name,
    screenshot_path: r.screenshot_path ?? null,
    screenshot_base64: r.screenshot_base64 ?? null,
  }));
}

export async function dbGetThemeById(id: string): Promise<ThemeRecord | undefined> {
  await ensureSchema();
  const p = getPool();
  const res = await p.query(
    `SELECT id, theme_id, name, screenshot_path, screenshot_base64 FROM ${TABLE} WHERE id = $1`,
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
  };
}

export async function dbCreateTheme(
  input: Omit<ThemeRecord, "id"> & { id?: string }
): Promise<ThemeRecord> {
  await ensureSchema();
  const id = input.id ?? generateId();
  const p = getPool();
  await p.query(
    `INSERT INTO ${TABLE} (id, theme_id, name, screenshot_path, screenshot_base64) VALUES ($1, $2, $3, $4, $5)`,
    [
      id,
      input.theme_id,
      input.name,
      input.screenshot_path ?? null,
      input.screenshot_base64 ?? null,
    ]
  );
  return {
    id,
    theme_id: input.theme_id,
    name: input.name,
    screenshot_path: input.screenshot_path ?? null,
    screenshot_base64: input.screenshot_base64 ?? null,
  };
}

export async function dbUpdateTheme(
  id: string,
  updates: Partial<Pick<ThemeRecord, "name" | "theme_id" | "screenshot_path" | "screenshot_base64">>
): Promise<ThemeRecord | undefined> {
  await ensureSchema();
  const current = await dbGetThemeById(id);
  if (!current) return undefined;
  const merged = { ...current, ...updates };
  const p = getPool();
  await p.query(
    `UPDATE ${TABLE} SET theme_id = $1, name = $2, screenshot_path = $3, screenshot_base64 = $4 WHERE id = $5`,
    [
      merged.theme_id,
      merged.name,
      merged.screenshot_path ?? null,
      merged.screenshot_base64 ?? null,
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
    process.env.DATABASE_URL?.trim() || process.env.DATABASE_PRIVATE_URL?.trim()
  );
}
