import fs from "fs";
import path from "path";
import type { ThemeRecord, CustomerRecord } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const THEMES_FILE = path.join(DATA_DIR, "themes.json");
const CUSTOMERS_FILE = path.join(DATA_DIR, "customers.json");

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

// Themes API
export function getAllThemes(): ThemeRecord[] {
  return readThemes();
}

export function getThemeById(id: string): ThemeRecord | undefined {
  return readThemes().find((t) => t.id === id);
}

export function createTheme(
  input: Omit<ThemeRecord, "id"> & { id?: string }
): ThemeRecord {
  const themes = readThemes();
  const theme: ThemeRecord = {
    id: input.id ?? generateId(),
    theme_id: input.theme_id,
    name: input.name,
    screenshot_path: input.screenshot_path ?? null,
  };
  themes.push(theme);
  writeThemes(themes);
  return theme;
}

export function updateTheme(
  id: string,
  updates: Partial<Pick<ThemeRecord, "name" | "theme_id" | "screenshot_path">>
): ThemeRecord | undefined {
  const themes = readThemes();
  const i = themes.findIndex((t) => t.id === id);
  if (i === -1) return undefined;
  themes[i] = { ...themes[i], ...updates };
  writeThemes(themes);
  return themes[i];
}

export function deleteTheme(id: string): boolean {
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
