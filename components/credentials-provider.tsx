"use client";

import { useState, useEffect } from "react";
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
import { Settings } from "lucide-react";

export function CredentialsProvider() {
  const { isAdmin, setAdmin } = useAdmin();
  const [open, setOpen] = useState(false);
  const [useDemo, setUseDemoState] = useState(true);
  const [merchantId, setMerchantId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");

  useEffect(() => {
    setUseDemoState(getUseDemo());
    const c = getStoredCredentials();
    setMerchantId(c.merchant_id);
    setSiteId(c.merchant_site_id);
    setSecretKey(c.merchantSecretKey);
  }, []);

  const handleUseDemoChange = (checked: boolean) => {
    setUseDemoState(checked);
    setUseDemo(checked);
  };

  const handleSave = () => {
    setStoredCredentials({
      merchant_id: merchantId,
      merchant_site_id: siteId,
      merchantSecretKey: secretKey,
    });
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
          <div className="absolute right-0 top-full z-50 mt-1 w-80 rounded-lg border bg-card p-4 shadow-lg">
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
