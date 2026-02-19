"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getUseDemo,
  setUseDemo,
  getStoredCredentials,
  setStoredCredentials,
} from "@/lib/credentials";
import { buildHostedUrlClient } from "@/lib/nuvei-client";

export function AddThemeForm() {
  const router = useRouter();
  const [themeId, setThemeId] = useState("");
  const [name, setName] = useState("");
  const [useDemo, setUseDemoState] = useState(getUseDemo());
  const [merchantId, setMerchantId] = useState(getStoredCredentials().merchant_id);
  const [siteId, setSiteId] = useState(getStoredCredentials().merchant_site_id);
  const [secretKey, setSecretKey] = useState(getStoredCredentials().merchantSecretKey);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUseDemoChange = (checked: boolean) => {
    setUseDemoState(checked);
    setUseDemo(checked);
  };

  const handleSaveCredentials = () => {
    setStoredCredentials({
      merchant_id: merchantId,
      merchant_site_id: siteId,
      merchantSecretKey: secretKey,
    });
  };

  const loadPreview = useCallback(async () => {
    setError(null);
    if (!themeId.trim()) {
      setError("Enter a theme ID");
      return;
    }
    setLoading(true);
    try {
      if (useDemo) {
        const res = await fetch("/api/hosted-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            useDemo: true,
            theme_id: themeId.trim(),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to get URL");
        setIframeUrl(data.url);
      } else {
        if (!merchantId.trim() || !siteId.trim() || !secretKey.trim()) {
          setError("Enter merchant ID, site ID, and secret key");
          setLoading(false);
          return;
        }
        const url = await buildHostedUrlClient(
          {
            merchant_id: merchantId.trim(),
            merchant_site_id: siteId.trim(),
            user_token_id: "demo@nuvei.local",
            theme_id: themeId.trim(),
          },
          secretKey
        );
        setIframeUrl(url);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [useDemo, themeId, merchantId, siteId, secretKey]);

  const handleSave = async () => {
    setError(null);
    if (!name.trim() || !themeId.trim()) {
      setError("Theme ID and name are required");
      return;
    }
    if (!iframeUrl) {
      setError("Load the preview first, then save");
      return;
    }
    setSaving(true);
    try {
      const screenshotRes = await fetch("/api/screenshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: iframeUrl }),
      });
      const screenshotData = await screenshotRes.json();
      if (!screenshotRes.ok) throw new Error(screenshotData.error || "Screenshot failed");

      const themeRes = await fetch("/api/themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme_id: themeId.trim(),
          name: name.trim(),
          screenshot_path: screenshotData.path ?? null,
        }),
      });
      if (!themeRes.ok) {
        const err = await themeRes.json();
        throw new Error(err.error || "Failed to save theme");
      }
      router.push("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium">Theme details</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme_id">Theme ID</Label>
            <Input
              id="theme_id"
              value={themeId}
              onChange={(e) => setThemeId(e.target.value)}
              placeholder="e.g. 1805251"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Display name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dark checkout"
            />
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="use_demo"
                checked={useDemo}
                onChange={(e) => handleUseDemoChange(e.target.checked)}
                className="rounded border-input"
              />
              <Label htmlFor="use_demo">Use demo credentials</Label>
            </div>
            {!useDemo && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="merchant_id">Merchant ID</Label>
                  <Input
                    id="merchant_id"
                    value={merchantId}
                    onChange={(e) => setMerchantId(e.target.value)}
                    onBlur={handleSaveCredentials}
                    placeholder="Merchant ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site_id">Merchant site ID</Label>
                  <Input
                    id="site_id"
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                    onBlur={handleSaveCredentials}
                    placeholder="Site ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secret">Secret key</Label>
                  <Input
                    id="secret"
                    type="password"
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    onBlur={handleSaveCredentials}
                    placeholder="Secret key"
                  />
                </div>
              </>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex gap-2">
            <Button onClick={loadPreview} disabled={loading}>
              {loading ? "Loading…" : "Load preview"}
            </Button>
            {iframeUrl && (
              <Button
                variant="secondary"
                onClick={() => setIframeUrl(null)}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium">Preview</h2>
          {iframeUrl && (
            <p className="text-sm text-muted-foreground">
              If the page looks correct, click Save below.
            </p>
          )}
        </CardHeader>
        <CardContent>
          {iframeUrl ? (
            <div className="aspect-video w-full overflow-hidden rounded-md border bg-muted">
              <iframe
                src={iframeUrl}
                title="Nuvei hosted page preview"
                className="w-full h-full min-h-[400px] border-0"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              />
            </div>
          ) : (
            <div className="aspect-video w-full rounded-md border border-dashed flex items-center justify-center text-muted-foreground text-sm">
              Click &quot;Load preview&quot; to see the hosted page
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSave}
            disabled={saving || !iframeUrl || !name.trim() || !themeId.trim()}
          >
            {saving ? "Saving…" : "Save theme"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
