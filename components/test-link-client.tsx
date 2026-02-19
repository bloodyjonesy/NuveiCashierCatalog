"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TestLinkClient() {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [themeId, setThemeId] = useState("");

  useEffect(() => {
    fetch("/api/hosted-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        useDemo: true,
        theme_id: themeId || undefined,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.url) setUrl(data.url);
        else setError(data.error || "No URL returned");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const refresh = () => {
    setLoading(true);
    setError(null);
    setUrl(null);
    fetch("/api/hosted-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        useDemo: true,
        theme_id: themeId.trim() || undefined,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.url) setUrl(data.url);
        else setError(data.error || "No URL returned");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  if (loading) {
    return <p className="text-muted-foreground">Loading…</p>;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium">Demo credentials not available</h2>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm mb-4">{error}</p>
          <p className="text-sm mb-2">
            In Railway, set these env vars (no spaces or newlines when pasting):
          </p>
          <ul className="text-sm list-disc list-inside text-muted-foreground mb-4">
            <li>NUVEI_MERCHANT_ID</li>
            <li>NUVEI_MERCHANT_SITE_ID</li>
            <li>NUVEI_SECRET_KEY</li>
          </ul>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-medium">Open hosted payment page</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="theme_id">Theme ID (optional)</Label>
          <Input
            id="theme_id"
            value={themeId}
            onChange={(e) => setThemeId(e.target.value)}
            placeholder="e.g. 1805251"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => url && window.open(url, "_blank")}
            disabled={!url}
          >
            Open payment page in new tab
          </Button>
          <Button variant="secondary" onClick={refresh}>
            Regenerate link
          </Button>
        </div>
        {url && (
          <p className="text-xs text-muted-foreground break-all">
            URL length: {url.length} chars (credentials are trimmed; no newlines in params)
          </p>
        )}
      </CardContent>
    </Card>
  );
}
