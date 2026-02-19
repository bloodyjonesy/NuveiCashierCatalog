/**
 * Client-side credential storage keys. Values stored in localStorage.
 */

export const CREDS_KEY = "nuvei_catalog_creds";
export const USE_DEMO_KEY = "nuvei_catalog_use_demo";

export type StoredCredentials = {
  merchant_id: string;
  merchant_site_id: string;
  merchantSecretKey: string;
};

export function getUseDemo(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(USE_DEMO_KEY) !== "false";
  } catch {
    return true;
  }
}

export function setUseDemo(useDemo: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(USE_DEMO_KEY, useDemo ? "true" : "false");
  } catch {}
}

export function getStoredCredentials(): StoredCredentials {
  if (typeof window === "undefined") {
    return { merchant_id: "", merchant_site_id: "", merchantSecretKey: "" };
  }
  try {
    const raw = localStorage.getItem(CREDS_KEY);
    if (!raw) return { merchant_id: "", merchant_site_id: "", merchantSecretKey: "" };
    const parsed = JSON.parse(raw) as StoredCredentials;
    return {
      merchant_id: typeof parsed.merchant_id === "string" ? parsed.merchant_id : "",
      merchant_site_id: typeof parsed.merchant_site_id === "string" ? parsed.merchant_site_id : "",
      merchantSecretKey: typeof parsed.merchantSecretKey === "string" ? parsed.merchantSecretKey : "",
    };
  } catch {
    return { merchant_id: "", merchant_site_id: "", merchantSecretKey: "" };
  }
}

export function setStoredCredentials(creds: StoredCredentials): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CREDS_KEY, JSON.stringify(creds));
  } catch {}
}
