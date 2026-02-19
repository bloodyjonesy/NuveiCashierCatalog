/**
 * Client-side Nuvei hosted URL builder. Uses Web Crypto for SHA-256.
 * Secret key must be in memory (e.g. from localStorage); never send to server.
 */

import {
  buildNuveiParams,
  concatValuesForChecksum,
  getBaseUrl,
  appendThemeType,
  type NuveiHostedParams,
  type ThemeType,
} from "./nuvei-params";

/** Compute SHA-256 hex in the browser. */
async function sha256Hex(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Build full hosted page URL in the browser (secret from localStorage/memory). */
export async function buildHostedUrlClient(
  params: Partial<NuveiHostedParams> & {
    merchant_id: string;
    merchant_site_id: string;
    user_token_id: string;
    theme_id?: string;
  },
  secretKey: string,
  themeType: ThemeType = "DESKTOP"
): Promise<string> {
  const full = buildNuveiParams(params);
  const secret = String(secretKey).trim().replace(/\r?\n/g, "");
  const toHash = secret + concatValuesForChecksum(full);
  const checksum = await sha256Hex(toHash);
  const qs =
    [
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
    ]
      .filter((k) => {
        const v = full[k as keyof NuveiHostedParams];
        return v !== undefined && v !== "";
      })
      .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent((full as Record<string, string>)[k])}`)
      .join("&") + `&checksum=${encodeURIComponent(checksum)}`;
  const url = `${getBaseUrl()}?${qs}`;
  return appendThemeType(url, themeType);
}
