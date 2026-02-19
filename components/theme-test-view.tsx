"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getUseDemo,
  getStoredCredentials,
} from "@/lib/credentials";
import { buildHostedUrlClient } from "@/lib/nuvei-client";
import { appendThemeType } from "@/lib/nuvei-params";
import type { ThemeRecord, CustomerRecord } from "@/lib/types";

export function ThemeTestView({ theme }: { theme: ThemeRecord }) {
  const [useDemo] = useState(getUseDemo());
  const creds = getStoredCredentials();
  const [themeType, setThemeType] = useState<"DESKTOP" | "SMARTPHONE">("DESKTOP");
  const [customerMode, setCustomerMode] = useState<"new" | "returning">("new");
  const [newUserTokenId, setNewUserTokenId] = useState("newuser@test.com");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveCustomerLabel, setSaveCustomerLabel] = useState("");
  const [savingCustomer, setSavingCustomer] = useState(false);

  const loadCustomers = useCallback(() => {
    fetch("/api/customers")
      .then((r) => r.json())
      .then((data) => setCustomers(Array.isArray(data) ? data : []))
      .catch(() => setCustomers([]));
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const getUserTokenId = (): string => {
    if (customerMode === "new") return newUserTokenId.trim() || "newuser@test.com";
    const c = customers.find((x) => x.id === selectedCustomerId);
    return c ? c.user_token_id : newUserTokenId;
  };

  const loadPaymentPage = useCallback(async () => {
    setError(null);
    const user_token_id = getUserTokenId();
    setLoading(true);
    try {
      if (useDemo) {
        const res = await fetch("/api/hosted-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            useDemo: true,
            theme_id: theme.theme_id,
            user_token_id,
            themeType,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to get URL");
        setIframeUrl(data.url);
      } else {
        if (!creds.merchant_id.trim() || !creds.merchant_site_id.trim() || !creds.merchantSecretKey.trim()) {
          setError("Configure your credentials (Add theme page or use demo)");
          setLoading(false);
          return;
        }
        const url = await buildHostedUrlClient(
          {
            merchant_id: creds.merchant_id,
            merchant_site_id: creds.merchant_site_id,
            user_token_id,
            theme_id: theme.theme_id,
          },
          creds.merchantSecretKey,
          themeType
        );
        setIframeUrl(url);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [useDemo, theme.theme_id, themeType, creds, customerMode, newUserTokenId, selectedCustomerId, customers]);

  const handleSaveAsCustomer = async () => {
    const label = saveCustomerLabel.trim();
    const user_token_id = getUserTokenId();
    if (!label) return;
    setSavingCustomer(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, user_token_id }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaveCustomerLabel("");
      loadCustomers();
    } catch {
      setError("Failed to save customer");
    } finally {
      setSavingCustomer(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium">Customer</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={customerMode === "new" ? "default" : "secondary"}
              size="sm"
              onClick={() => setCustomerMode("new")}
            >
              New customer
            </Button>
            <Button
              variant={customerMode === "returning" ? "default" : "secondary"}
              size="sm"
              onClick={() => setCustomerMode("returning")}
            >
              Returning customer
            </Button>
          </div>
          {customerMode === "new" && (
            <div className="space-y-2">
              <Label htmlFor="user_token">User token ID (e.g. email)</Label>
              <Input
                id="user_token"
                value={newUserTokenId}
                onChange={(e) => setNewUserTokenId(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
          )}
          {customerMode === "returning" && (
            <div className="space-y-2">
              <Label>Select customer</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
              >
                <option value="">— Select —</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label} ({c.user_token_id})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex gap-2 items-center">
            <Label>Layout</Label>
            <Button
              type="button"
              variant={themeType === "DESKTOP" ? "default" : "secondary"}
              size="sm"
              onClick={() => {
                setThemeType("DESKTOP");
                if (iframeUrl) setIframeUrl(appendThemeType(iframeUrl, "DESKTOP"));
              }}
            >
              Desktop
            </Button>
            <Button
              type="button"
              variant={themeType === "SMARTPHONE" ? "default" : "secondary"}
              size="sm"
              onClick={() => {
                setThemeType("SMARTPHONE");
                if (iframeUrl) setIframeUrl(appendThemeType(iframeUrl, "SMARTPHONE"));
              }}
            >
              Mobile
            </Button>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={loadPaymentPage} disabled={loading}>
            {loading ? "Loading…" : "Open payment page"}
          </Button>

          <div className="pt-4 border-t space-y-2">
            <Label htmlFor="save_customer_label">Save as demo customer</Label>
            <div className="flex gap-2">
              <Input
                id="save_customer_label"
                value={saveCustomerLabel}
                onChange={(e) => setSaveCustomerLabel(e.target.value)}
                placeholder="e.g. Returning – John"
              />
              <Button
                variant="secondary"
                onClick={handleSaveAsCustomer}
                disabled={savingCustomer || !saveCustomerLabel.trim()}
              >
                {savingCustomer ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium">Test payment</h2>
        </CardHeader>
        <CardContent>
          {iframeUrl ? (
            <div className="w-full overflow-hidden rounded-md border bg-muted min-h-[720px] h-[75vh]">
              <iframe
                src={iframeUrl}
                title="Nuvei payment page"
                className="w-full h-full min-h-[720px] border-0"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              />
            </div>
          ) : (
            <div className="w-full min-h-[400px] rounded-md border border-dashed flex items-center justify-center text-muted-foreground text-sm">
              Click &quot;Open payment page&quot; to load the hosted page
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
