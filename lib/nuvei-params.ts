/**
 * Nuvei Payment Page (purchase.do) parameter order and checksum.
 * Order must match request query string and checksum concatenation.
 * @see https://docs.nuvei.com/documentation/accept-payment/payment-page/quick-start-for-payment-page
 */

const NUVEI_BASE = "https://secure.nuvei.com/ppp/purchase.do";

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

/** Build params with defaults; theme_id optional. */
export function buildNuveiParams(overrides: Partial<NuveiHostedParams> & { theme_id?: string }): NuveiHostedParams {
  const now = toNuveiTimestamp();
  return {
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
    ...overrides,
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

/** Backend: build full hosted page URL with checksum (uses secret from env). */
export function buildHostedUrlNode(
  params: Partial<NuveiHostedParams> & { merchant_id: string; merchant_site_id: string },
  secretKey: string
): string {
  const full = buildNuveiParams(params);
  const checksum = computeChecksumNode(secretKey, full);
  const qs = toQueryString(full) + "&checksum=" + encodeURIComponent(checksum);
  return `${NUVEI_BASE}?${qs}`;
}

export { toNuveiTimestamp, concatValuesForChecksum, NUVEI_BASE, PARAM_ORDER };
