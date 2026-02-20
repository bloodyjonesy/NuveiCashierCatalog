"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type Props = {
  themeId: string;
  initialCss: string;
};

export function CustomizePageClient({ themeId, initialCss }: Props) {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [css, setCss] = useState(initialCss);
  const [proxyHtml, setProxyHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<"saved" | "error" | null>(null);

  const sendCssToIframe = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (win) win.postMessage({ type: "custom-css", css }, "*");
  }, [css]);

  useEffect(() => {
    sendCssToIframe();
  }, [sendCssToIframe]);

  const loadPreview = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/hosted-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          useDemo: true,
          theme_id: themeId,
          user_token_id: "demo@nuvei.local",
          total_amount: "1.00",
          currency: "USD",
          item_name_1: "Test item",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get URL");
      const url = data.url as string;

      const proxyRes = await fetch("/api/theme-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!proxyRes.ok) {
        const err = await proxyRes.json().catch(() => ({}));
        throw new Error(err.error || "Failed to load preview");
      }
      const html = await proxyRes.text();
      setProxyHtml(html);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [themeId]);

  const handleIframeLoad = () => sendCssToIframe();

  const saveCss = useCallback(async () => {
    setSaveMessage(null);
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ default_theme_custom_css: css }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaveMessage("saved");
      router.refresh();
    } catch {
      setSaveMessage("error");
    } finally {
      setSaving(false);
    }
  }, [css, router]);

  const copyCss = () => {
    navigator.clipboard.writeText(css);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold">Customize default theme</h1>
        <p className="text-muted-foreground text-sm">Theme ID: {themeId}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="w-full lg:w-[400px] xl:w-[480px] shrink-0 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <h2 className="text-sm font-medium">Preview</h2>
            </CardHeader>
            <CardContent>
              <Button onClick={loadPreview} disabled={loading} className="w-full">
                {loading ? "Loading…" : "Load payment page preview"}
              </Button>
              {error && (
                <p className="text-sm text-destructive mt-2">{error}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <h2 className="text-sm font-medium">CSS (edit directly)</h2>
              <p className="text-xs text-muted-foreground">
                Changes apply live in the preview. Paste or edit the default theme CSS and override as needed.
              </p>
            </CardHeader>
            <CardContent>
              <textarea
                value={css}
                onChange={(e) => setCss(e.target.value)}
                placeholder={":root { ... }\nbody { ... }\n..."}
                className="w-full min-h-[320px] rounded-md border border-input bg-background px-3 py-2 text-xs font-mono resize-y"
                spellCheck={false}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <h2 className="text-sm font-medium">Actions</h2>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button variant="secondary" size="sm" onClick={copyCss}>
                Copy CSS
              </Button>
              <Button variant="default" size="sm" onClick={saveCss} disabled={saving}>
                {saving ? "Saving…" : "Save CSS"}
              </Button>
              {saveMessage === "saved" && (
                <p className="text-sm text-green-600">Saved.</p>
              )}
              {saveMessage === "error" && (
                <p className="text-sm text-destructive">Failed to save.</p>
              )}
            </CardContent>
          </Card>
        </aside>

        <div className="flex-1 min-w-0">
          <Card>
            <CardHeader className="pb-2">
              <h2 className="text-sm font-medium">Live preview</h2>
              <p className="text-xs text-muted-foreground">
                Preview only; form submission will not work.
              </p>
            </CardHeader>
            <CardContent>
              {proxyHtml ? (
                <div className="w-full overflow-hidden rounded-md border bg-muted aspect-video max-h-[70vh]">
                  <iframe
                    ref={iframeRef}
                    srcDoc={proxyHtml}
                    title="Payment page preview"
                    className="w-full h-full min-h-[360px] border-0"
                    sandbox="allow-same-origin allow-scripts allow-forms"
                    onLoad={handleIframeLoad}
                  />
                </div>
              ) : (
                <div className="w-full aspect-video max-h-[50vh] rounded-md border border-dashed flex items-center justify-center text-muted-foreground text-sm bg-muted/30">
                  Click &quot;Load payment page preview&quot; to start
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
