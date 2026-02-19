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
import type { ThemeRecord, CustomerRecord } from "@/lib/types";

export function ThemeTestView({ theme }: { theme: ThemeRecord }) {
  const [useDemo] = useState(getUseDemo());
  const creds = getStoredCredentials();
  const [customerMode, setCustomerMode] = useState<"new" | "returning">("new");
  const [newUserTokenId, setNewUserTokenId] = useState("newuser@test.com");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveCustomerLabel, setSaveCustomerLabel] = useState("");
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [dmns, setDmns] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    if (!iframeUrl) return;
    const fetchDmns = () => {
      fetch("/api/dmn")
        .then((r) => r.json())
        .then((list) => setDmns(Array.isArray(list) ? list : []))
        .catch(() => {});
    };
    fetchDmns();
    const t = setInterval(fetchDmns, 3000);
    return () => clearInterval(t);
  }, [iframeUrl]);

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
          creds.merchantSecretKey
        );
        setIframeUrl(url);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [useDemo, theme.theme_id, creds, customerMode, newUserTokenId, selectedCustomerId, customers]);

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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium">View & test</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex gap-2 items-center shrink-0">
              <Label className="shrink-0">Customer</Label>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant={customerMode === "new" ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setCustomerMode("new")}
                >
                  New
                </Button>
                <Button
                  type="button"
                  variant={customerMode === "returning" ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setCustomerMode("returning")}
                >
                  Returning
                </Button>
              </div>
            </div>
            {customerMode === "new" && (
              <div className="space-y-2 min-w-[200px]">
                <Label htmlFor="user_token">User token ID</Label>
                <Input
                  id="user_token"
                  value={newUserTokenId}
                  onChange={(e) => setNewUserTokenId(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
            )}
            {customerMode === "returning" && (
              <div className="space-y-2 min-w-[220px]">
                <Label htmlFor="returning_customer">Returning customer</Label>
                <select
                  id="returning_customer"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                >
                  <option value="">— Select customer —</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label} ({c.user_token_id})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <Button onClick={loadPaymentPage} disabled={loading} className="shrink-0">
              {loading ? "Loading…" : "Open payment page"}
            </Button>
            <div className="flex gap-2 items-end min-w-[200px] ml-auto">
              <div className="space-y-2 flex-1 min-w-0">
                <Label htmlFor="save_customer_label">Save as demo customer</Label>
                <Input
                  id="save_customer_label"
                  value={saveCustomerLabel}
                  onChange={(e) => setSaveCustomerLabel(e.target.value)}
                  placeholder="e.g. Returning – John"
                />
              </div>
              <Button
                variant="secondary"
                onClick={handleSaveAsCustomer}
                disabled={savingCustomer || !saveCustomerLabel.trim()}
              >
                {savingCustomer ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium">Preview</h2>
        </CardHeader>
        <CardContent>
          {iframeUrl ? (
            <div className="w-full overflow-hidden rounded-md border bg-muted aspect-video max-h-[70vh]">
              <iframe
                src={iframeUrl}
                title="Nuvei payment page"
                className="w-full h-full min-h-[360px] border-0"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              />
            </div>
          ) : (
            <div className="w-full aspect-video max-h-[50vh] rounded-md border border-dashed flex items-center justify-center text-muted-foreground text-sm bg-muted/30">
              Click &quot;Open payment page&quot; to load the hosted page
            </div>
          )}
        </CardContent>
      </Card>

      {iframeUrl && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-medium">DMNs received</h2>
            <p className="text-sm text-muted-foreground">
              Notifications sent to your DMN URL (Credentials → Integration URLs). Polls every 3s.
            </p>
          </CardHeader>
          <CardContent>
            {dmns.length === 0 ? (
              <p className="text-sm text-muted-foreground">No DMNs yet. Configure your Nuvei account to use the DMN URL and complete a payment or trigger a notification.</p>
            ) : (
              <div className="space-y-3 max-h-[280px] overflow-y-auto">
                {dmns.map((dmn, i) => (
                  <div key={i} className="rounded border bg-muted/50 p-3 text-xs font-mono">
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {["ppp_status", "Status", "totalAmount", "currency", "message", "PPP_TransactionId", "productId", "_receivedAt", "_source"].map(
                        (k) =>
                          (dmn as Record<string, unknown>)[k] != null &&
                          (dmn as Record<string, unknown>)[k] !== "" && (
                            <span key={k}>
                              <span className="text-muted-foreground">{k}:</span>{" "}
                              {String((dmn as Record<string, unknown>)[k])}
                            </span>
                          )
                      )}
                    </div>
                    <details className="mt-2">
                      <summary className="cursor-pointer text-muted-foreground">All params</summary>
                      <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-all">
                        {JSON.stringify(dmn, null, 2)}
                      </pre>
                    </details>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
