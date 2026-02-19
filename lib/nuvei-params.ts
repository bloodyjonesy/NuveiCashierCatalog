/**
 * Nuvei Payment Page (purchase.do) parameter order and checksum.
 * Order must match request query string and checksum concatenation.
 * Sandbox: https://ppp-test.safecharge.com/ppp/purchase.do
 * Production: https://secure.nuvei.com/ppp/purchase.do
 * @see https://docs.nuvei.com/documentation/accept-payment/payment-page/quick-start-for-payment-page
 */

const SANDBOX_BASE = "https://ppp-test.safecharge.com/ppp/purchase.do";
const PRODUCTION_BASE = "https://secure.nuvei.com/ppp/purchase.do";

function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return (process.env.NEXT_PUBLIC_NUVEI_PPP_BASE_URL ?? SANDBOX_BASE).trim();
  }
  return (process.env.NUVEI_PPP_BASE_URL ?? process.env.NEXT_PUBLIC_NUVEI_PPP_BASE_URL ?? SANDBOX_BASE).trim();
}

/** @deprecated Use getBaseUrl() for sandbox/production. */
const NUVEI_BASE = SANDBOX_BASE;

export type NuveiHostedParams = {
  merchant_id: string;
  merchant_site_id: string;
  total_amount: string;
  currency: string;
  user_token_id: string;
  item_name_1: string;
  item_amount_1: string;
  item_quantity_1: string;
  time_stamp: string;
  version: string;
  notify_url: string;
  theme_id?: string;
};

/** Parameter keys in the exact order used for request and checksum. */
const PARAM_ORDER: (keyof NuveiHostedParams)[] = [
  "merchant_id",
  "merchant_site_id",
  "total_amount",
  "currency",
  "user_token_id",
  "item_name_1",
  "item_amount_1",
  "item_quantity_1",
  "time_stamp",
  "version",
  "notify_url",
  "theme_id",
];

function toNuveiTimestamp(d: Date = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  const s = pad(d.getSeconds());
  return `${y}-${m}-${day}.${h}:${min}:${s}`;
}

/** Trim string and strip newlines (avoids "invalid merchant id" from env/form paste). */
function cleanParam(value: unknown): string {
  if (value === undefined || value === null) return "";
  const s = String(value).trim().replace(/\r?\n/g, "");
  return s;
}

/** Build params with defaults; theme_id optional. All string params are cleaned. */
export function buildNuveiParams(overrides: Partial<NuveiHostedParams> & { theme_id?: string }): NuveiHostedParams {
  const now = toNuveiTimestamp();
  const base = {
    merchant_id: "",
    merchant_site_id: "",
    total_amount: "1.00",
    currency: "USD",
    user_token_id: "demo@nuvei.local",
    item_name_1: "Test item",
    item_amount_1: "1.00",
    item_quantity_1: "1",
    time_stamp: now,
    version: "4.0.0",
    notify_url: typeof window !== "undefined"
      ? `${window.location.origin}/api/notify`
      : process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/api/notify`
        : "https://example.com/api/notify",
  };
  const merged = { ...base, ...overrides };
  return {
    merchant_id: cleanParam(merged.merchant_id),
    merchant_site_id: cleanParam(merged.merchant_site_id),
    total_amount: cleanParam(merged.total_amount) || "1.00",
    currency: cleanParam(merged.currency) || "USD",
    user_token_id: cleanParam(merged.user_token_id) || "demo@nuvei.local",
    item_name_1: cleanParam(merged.item_name_1) || "Test item",
    item_amount_1: cleanParam(merged.item_amount_1) || "1.00",
    item_quantity_1: cleanParam(merged.item_quantity_1) || "1",
    time_stamp: merged.time_stamp ? cleanParam(merged.time_stamp) : now,
    version: cleanParam(merged.version) || "4.0.0",
    notify_url: cleanParam(merged.notify_url) || base.notify_url,
    ...(merged.theme_id ? { theme_id: cleanParam(merged.theme_id) } : {}),
  };
}

/** Concatenated values in order (for checksum). Only include keys that are present in params. */
function concatValuesForChecksum(params: NuveiHostedParams): string {
  let s = "";
  for (const key of PARAM_ORDER) {
    const v = params[key];
    if (v !== undefined && v !== "") s += v;
  }
  return s;
}

/** Node (backend): compute SHA-256 hex of secret + concat values. */
export function computeChecksumNode(secretKey: string, params: NuveiHostedParams): string {
  const crypto = require("crypto");
  const toHash = secretKey + concatValuesForChecksum(params);
  return crypto.createHash("sha256").update(toHash, "utf8").digest("hex");
}

/** Build query string from params (only defined keys, in order). */
function toQueryString(params: NuveiHostedParams): string {
  const entries: string[] = [];
  for (const key of PARAM_ORDER) {
    const v = params[key];
    if (v !== undefined && v !== "") {
      entries.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`);
    }
  }
  return entries.join("&");
}

/** themeType is optional and not part of checksum. Append to URL for desktop/mobile layout. */
export type ThemeType = "DESKTOP" | "SMARTPHONE";

export function appendThemeType(url: string, themeType: ThemeType): string {
  const sep = url.includes("?") ? "&" : "?";
  const existing = /[?&]themeType=/i.test(url);
  if (existing) {
    return url.replace(/themeType=[^&]+/i, `themeType=${themeType}`);
  }
  return `${url}${sep}themeType=${themeType}`;
}

/** Backend: build full hosted page URL with checksum (uses secret from env). */
export function buildHostedUrlNode(
  params: Partial<NuveiHostedParams> & { merchant_id: string; merchant_site_id: string },
  secretKey: string,
  themeType: ThemeType = "DESKTOP"
): string {
  const full = buildNuveiParams(params);
  const checksum = computeChecksumNode(secretKey, full);
  const qs = toQueryString(full) + "&checksum=" + encodeURIComponent(checksum);
  const url = `${getBaseUrl()}?${qs}`;
  return appendThemeType(url, themeType);
}

export { toNuveiTimestamp, concatValuesForChecksum, getBaseUrl, NUVEI_BASE, SANDBOX_BASE, PRODUCTION_BASE, PARAM_ORDER };
