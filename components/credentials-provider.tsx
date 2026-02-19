"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getUseDemo,
  setUseDemo,
  getStoredCredentials,
  setStoredCredentials,
  checkAdminPassword,
} from "@/lib/credentials";
import { useAdmin } from "@/contexts/admin-context";
import { Settings, Copy } from "lucide-react";

type PreDepositMode = "always_accept" | "decline_with_message" | "decline_without_message";

export function CredentialsProvider() {
  const { isAdmin, setAdmin } = useAdmin();
  const [open, setOpen] = useState(false);
  const [useDemo, setUseDemoState] = useState(true);
  const [merchantId, setMerchantId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [preDepositMode, setPreDepositModeState] = useState<PreDepositMode>("always_accept");
  const [preDepositMessage, setPreDepositMessage] = useState("Your attempt has been declined.");
  const [copied, setCopied] = useState<string | null>(null);

  const loadPreDepositConfig = useCallback(() => {
    fetch("/api/pre-deposit-config")
      .then((r) => r.json())
      .then((c) => {
        setPreDepositModeState(c.mode ?? "always_accept");
        setPreDepositMessage(c.declineMessage ?? "Your attempt has been declined.");
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setUseDemoState(getUseDemo());
    const c = getStoredCredentials();
    setMerchantId(c.merchant_id);
    setSiteId(c.merchant_site_id);
    setSecretKey(c.merchantSecretKey);
    loadPreDepositConfig();
  }, [loadPreDepositConfig]);

  const handleUseDemoChange = (checked: boolean) => {
    setUseDemoState(checked);
    setUseDemo(checked);
  };

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const dmnUrl = baseUrl ? `${baseUrl}/api/dmn` : "";
  const preDepositDmnUrl = baseUrl ? `${baseUrl}/api/pre-deposit-dmn` : "";

  const copyUrl = (url: string, label: string) => {
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const handleSave = () => {
    setStoredCredentials({
      merchant_id: merchantId,
      merchant_site_id: siteId,
      merchantSecretKey: secretKey,
    });
    fetch("/api/pre-deposit-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: preDepositMode,
        declineMessage: preDepositMode === "decline_with_message" ? preDepositMessage : undefined,
      }),
    }).catch(() => {});
    setOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen((o) => !o)}
        className="gap-2"
      >
        <Settings className="h-4 w-4" />
        Credentials
      </Button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-1 w-96 max-h-[90vh] overflow-y-auto rounded-lg border bg-card p-4 shadow-lg">
            <p className="text-sm font-medium mb-3">Credentials</p>
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                id="creds_use_demo"
                checked={useDemo}
                onChange={(e) => handleUseDemoChange(e.target.checked)}
                className="rounded border-input"
              />
              <Label htmlFor="creds_use_demo">Use demo credentials</Label>
            </div>
            {!useDemo && (
              <div className="space-y-2 mb-3">
                <Label htmlFor="creds_mid">Merchant ID</Label>
                <Input
                  id="creds_mid"
                  value={merchantId}
                  onChange={(e) => setMerchantId(e.target.value)}
                  placeholder="Merchant ID"
                />
                <Label htmlFor="creds_sid">Site ID</Label>
                <Input
                  id="creds_sid"
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
                  placeholder="Site ID"
                />
                <Label htmlFor="creds_secret">Secret key</Label>
                <Input
                  id="creds_secret"
                  type="password"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="Secret key"
                />
              </div>
            )}
            <div className="border-t pt-3 mt-3 space-y-2 mb-3">
              <p className="text-sm font-medium">Integration URLs</p>
              <p className="text-xs text-muted-foreground">Configure these in your Nuvei account.</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1">
                  <Label className="text-xs shrink-0">DMN URL</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 shrink-0"
                    onClick={() => copyUrl(dmnUrl, "dmn")}
                    title="Copy"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  {copied === "dmn" && <span className="text-xs text-muted-foreground">Copied</span>}
                </div>
                <p className="text-xs font-mono bg-muted px-2 py-1 rounded break-all">{dmnUrl || "—"}</p>
                <div className="flex items-center gap-1 mt-2">
                  <Label className="text-xs shrink-0">Pre-deposit DMN URL</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 shrink-0"
                    onClick={() => copyUrl(preDepositDmnUrl, "pre")}
                    title="Copy"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  {copied === "pre" && <span className="text-xs text-muted-foreground">Copied</span>}
                </div>
                <p className="text-xs font-mono bg-muted px-2 py-1 rounded break-all">{preDepositDmnUrl || "—"}</p>
              </div>
            </div>
            <div className="border-t pt-3 mt-3 space-y-2 mb-3">
              <p className="text-sm font-medium">Pre-deposit DMN response</p>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={preDepositMode}
                onChange={(e) => setPreDepositModeState(e.target.value as PreDepositMode)}
              >
                <option value="always_accept">Always accept</option>
                <option value="decline_with_message">Decline with message</option>
                <option value="decline_without_message">Decline without message</option>
              </select>
              {preDepositMode === "decline_with_message" && (
                <Input
                  value={preDepositMessage}
                  onChange={(e) => setPreDepositMessage(e.target.value)}
                  placeholder="Decline message"
                  className="text-sm"
                />
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Stored in this browser only. Demo keys are server-side.
            </p>
            <div className="border-t pt-3 mt-3 space-y-2">
              <p className="text-sm font-medium">Admin mode</p>
              {isAdmin ? (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setAdmin(false);
                    setAdminPassword("");
                    setAdminError("");
                  }}
                >
                  Exit admin
                </Button>
              ) : (
                <>
                  <Label htmlFor="admin_pw" className="sr-only">Password</Label>
                  <Input
                    id="admin_pw"
                    type="password"
                    value={adminPassword}
                    onChange={(e) => {
                      setAdminPassword(e.target.value);
                      setAdminError("");
                    }}
                    placeholder="Admin password"
                    className="mb-1"
                  />
                  {adminError && (
                    <p className="text-xs text-destructive">{adminError}</p>
                  )}
                  <Button
                    size="sm"
                    onClick={() => {
                      if (checkAdminPassword(adminPassword)) {
                        setAdmin(true);
                        setAdminPassword("");
                        setAdminError("");
                      } else {
                        setAdminError("Wrong password");
                      }
                    }}
                  >
                    Unlock admin
                  </Button>
                </>
              )}
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={handleSave}>
                Save
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
