import fs from "fs";
import path from "path";
import type { ThemeRecord, CustomerRecord } from "./types";
import {
  useDatabase,
  dbGetAllThemes,
  dbGetThemeById,
  dbGetThemeByThemeId as dbGetThemeByThemeIdDb,
  dbCreateTheme,
  dbUpdateTheme,
  dbDeleteTheme,
  dbGetSetting,
  dbSetSetting,
} from "./db";

const DATA_DIR = path.join(process.cwd(), "data");
const THEMES_FILE = path.join(DATA_DIR, "themes.json");
const CUSTOMERS_FILE = path.join(DATA_DIR, "customers.json");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");

const DEFAULT_THEME_ID_KEY = "default_theme_id";
/** Hardcoded default theme ID when no setting is stored. */
const FALLBACK_DEFAULT_THEME_ID = "223482";

type Settings = { default_theme_id?: string | null };

function readSettings(): Settings {
  ensureDataDir();
  if (!fs.existsSync(SETTINGS_FILE)) return {};
  try {
    const raw = fs.readFileSync(SETTINGS_FILE, "utf8");
    const data = JSON.parse(raw) as Settings;
    return typeof data === "object" && data !== null ? data : {};
  } catch {
    return {};
  }
}

function writeSettings(settings: Settings) {
  ensureDataDir();
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf8");
}

export type { ThemeRecord, CustomerRecord };

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readThemes(): ThemeRecord[] {
  ensureDataDir();
  if (!fs.existsSync(THEMES_FILE)) return [];
  try {
    const raw = fs.readFileSync(THEMES_FILE, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeThemes(themes: ThemeRecord[]) {
  ensureDataDir();
  fs.writeFileSync(THEMES_FILE, JSON.stringify(themes, null, 2), "utf8");
}

function readCustomers(): CustomerRecord[] {
  ensureDataDir();
  if (!fs.existsSync(CUSTOMERS_FILE)) return [];
  try {
    const raw = fs.readFileSync(CUSTOMERS_FILE, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeCustomers(customers: CustomerRecord[]) {
  ensureDataDir();
  fs.writeFileSync(CUSTOMERS_FILE, JSON.stringify(customers, null, 2), "utf8");
}

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Themes API — uses PostgreSQL when DATABASE_URL is set, else JSON file (data/themes.json)
export async function getAllThemes(): Promise<ThemeRecord[]> {
  if (useDatabase()) return dbGetAllThemes();
  return readThemes();
}

export async function getThemeById(id: string): Promise<ThemeRecord | undefined> {
  if (useDatabase()) return dbGetThemeById(id);
  return readThemes().find((t) => t.id === id);
}

export async function getThemeByThemeId(themeId: string): Promise<ThemeRecord | undefined> {
  if (useDatabase()) return dbGetThemeByThemeIdDb(themeId);
  return readThemes().find((t) => t.theme_id === themeId);
}

export async function getDefaultThemeId(): Promise<string> {
  if (useDatabase()) {
    const v = await dbGetSetting(DEFAULT_THEME_ID_KEY);
    return (v && v.trim()) ? v.trim() : FALLBACK_DEFAULT_THEME_ID;
  }
  const v = readSettings().default_theme_id;
  return (v && String(v).trim()) ? String(v).trim() : FALLBACK_DEFAULT_THEME_ID;
}

export async function setDefaultThemeId(themeId: string | null): Promise<void> {
  if (useDatabase()) {
    await dbSetSetting(DEFAULT_THEME_ID_KEY, themeId ?? "");
    return;
  }
  const s = readSettings();
  if (themeId === null || themeId === "") {
    delete s.default_theme_id;
  } else {
    s.default_theme_id = themeId;
  }
  writeSettings(s);
}

export async function createTheme(
  input: Omit<ThemeRecord, "id"> & { id?: string }
): Promise<ThemeRecord> {
  if (useDatabase()) return dbCreateTheme(input);
  const themes = readThemes();
  const theme: ThemeRecord = {
    id: input.id ?? generateId(),
    theme_id: input.theme_id,
    name: input.name,
    screenshot_path: input.screenshot_path ?? null,
    screenshot_base64: input.screenshot_base64 ?? null,
    color_palette: input.color_palette ?? null,
    custom_css: input.custom_css ?? null,
  };
  themes.push(theme);
  writeThemes(themes);
  return theme;
}

export async function updateTheme(
  id: string,
  updates: Partial<Pick<ThemeRecord, "name" | "theme_id" | "screenshot_path" | "screenshot_base64" | "color_palette" | "custom_css">>
): Promise<ThemeRecord | undefined> {
  if (useDatabase()) return dbUpdateTheme(id, updates);
  const themes = readThemes();
  const i = themes.findIndex((t) => t.id === id);
  if (i === -1) return undefined;
  themes[i] = { ...themes[i], ...updates };
  writeThemes(themes);
  return themes[i];
}

export async function deleteTheme(id: string): Promise<boolean> {
  if (useDatabase()) return dbDeleteTheme(id);
  const themes = readThemes();
  const filtered = themes.filter((t) => t.id !== id);
  if (filtered.length === themes.length) return false;
  writeThemes(filtered);
  return true;
}

// Customers API
export function getAllCustomers(): CustomerRecord[] {
  return readCustomers();
}

export function createCustomer(
  input: Omit<CustomerRecord, "id"> & { id?: string }
): CustomerRecord {
  const customers = readCustomers();
  const customer: CustomerRecord = {
    id: input.id ?? generateId(),
    label: input.label,
    user_token_id: input.user_token_id,
  };
  customers.push(customer);
  writeCustomers(customers);
  return customer;
}

export function deleteCustomer(id: string): boolean {
  const customers = readCustomers();
  const filtered = customers.filter((c) => c.id !== id);
  if (filtered.length === customers.length) return false;
  writeCustomers(filtered);
  return true;
}
