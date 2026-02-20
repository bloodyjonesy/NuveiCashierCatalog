"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ThemeRecord } from "@/lib/types";

type ThemeCustomizerProps = { theme: ThemeRecord };

const FONT_OPTIONS = [
  { value: "", label: "Default" },
  { value: "system-ui, sans-serif", label: "System" },
  { value: "Inter, sans-serif", label: "Inter" },
  { value: "'Segoe UI', sans-serif", label: "Segoe UI" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "monospace", label: "Monospace" },
];

export function ThemeCustomizer({ theme }: ThemeCustomizerProps) {
  const [hostedUrl, setHostedUrl] = useState<string | null>(null);
  const [proxyHtml, setProxyHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const savedCss = theme.custom_css ?? "";

  const [bodyBg, setBodyBg] = useState("#ffffff");
  const [textColor, setTextColor] = useState("#1a1a1a");
  const [linkColor, setLinkColor] = useState("#2563eb");
  const [buttonBg, setButtonBg] = useState("#2563eb");
  const [buttonText, setButtonText] = useState("#ffffff");
  const [inputBorderColor, setInputBorderColor] = useState("#d1d5db");
  const [borderWidth, setBorderWidth] = useState(1);
  const [borderStyle, setBorderStyle] = useState<"solid" | "dashed" | "none">("solid");
  const [borderRadius, setBorderRadius] = useState(8);
  const [fontFamily, setFontFamily] = useState("");
  const [fontSize, setFontSize] = useState(16);
  const [fontWeight, setFontWeight] = useState<"400" | "500" | "600" | "700">("400");
  const [padding, setPadding] = useState(16);
  const [gap, setGap] = useState(8);
  const [customCss, setCustomCss] = useState(savedCss);

  const buildCss = useCallback(() => {
    const border =
      borderStyle === "none"
        ? "none"
        : `${borderWidth}px ${borderStyle} ${inputBorderColor}`;
    const lines: string[] = [
      `body { background: ${bodyBg}; color: ${textColor}; font-family: ${fontFamily || "inherit"}; font-size: ${fontSize}px; font-weight: ${fontWeight}; padding: ${padding}px; }`,
      `body * { box-sizing: border-box; }`,
      `a { color: ${linkColor}; }`,
      `button, .btn, input[type="submit"], [role="button"] { background: ${buttonBg}; color: ${buttonText}; border: ${border}; border-radius: ${borderRadius}px; padding: ${padding}px; font-size: ${fontSize}px; font-weight: ${fontWeight}; }`,
      `input, select, textarea { border: ${border}; border-radius: ${borderRadius}px; padding: ${padding}px; font-size: ${fontSize}px; }`,
      `.main-container, [class*="container"], [class*="wrapper"] { padding: ${padding}px; gap: ${gap}px; }`,
    ];
    if (customCss.trim()) lines.push(customCss.trim());
    return lines.join("\n");
  }, [
    bodyBg,
    textColor,
    linkColor,
    buttonBg,
    buttonText,
    inputBorderColor,
    borderWidth,
    borderStyle,
    borderRadius,
    fontFamily,
    fontSize,
    fontWeight,
    padding,
    gap,
    customCss,
  ]);

  const sendCssToIframe = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (win) win.postMessage({ type: "custom-css", css: buildCss() }, "*");
  }, [buildCss]);

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
          theme_id: theme.theme_id,
          user_token_id: "demo@nuvei.local",
          total_amount: "1.00",
          currency: "USD",
          item_name_1: "Test item",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get URL");
      const url = data.url as string;
      setHostedUrl(url);

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
  }, [theme.theme_id]);

  const handleIframeLoad = () => sendCssToIframe();

  const copyCss = () => {
    navigator.clipboard.writeText(buildCss());
  };

  const saveToTheme = async () => {
    try {
      const res = await fetch(`/api/themes/${theme.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ custom_css: buildCss() }),
      });
      if (!res.ok) throw new Error("Failed to save");
    } catch {
      setError("Failed to save to theme");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <aside className="w-full lg:w-[320px] shrink-0 space-y-4">
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
            <h2 className="text-sm font-medium">Colors</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="w-28 text-xs">Body bg</Label>
              <Input
                type="color"
                value={bodyBg}
                onChange={(e) => setBodyBg(e.target.value)}
                className="h-9 w-16 p-1"
              />
              <Input
                value={bodyBg}
                onChange={(e) => setBodyBg(e.target.value)}
                className="h-9 flex-1 font-mono text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-28 text-xs">Text</Label>
              <Input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="h-9 w-16 p-1" />
              <Input value={textColor} onChange={(e) => setTextColor(e.target.value)} className="h-9 flex-1 font-mono text-xs" />
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-28 text-xs">Links</Label>
              <Input type="color" value={linkColor} onChange={(e) => setLinkColor(e.target.value)} className="h-9 w-16 p-1" />
              <Input value={linkColor} onChange={(e) => setLinkColor(e.target.value)} className="h-9 flex-1 font-mono text-xs" />
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-28 text-xs">Button bg</Label>
              <Input type="color" value={buttonBg} onChange={(e) => setButtonBg(e.target.value)} className="h-9 w-16 p-1" />
              <Input value={buttonBg} onChange={(e) => setButtonBg(e.target.value)} className="h-9 flex-1 font-mono text-xs" />
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-28 text-xs">Button text</Label>
              <Input type="color" value={buttonText} onChange={(e) => setButtonText(e.target.value)} className="h-9 w-16 p-1" />
              <Input value={buttonText} onChange={(e) => setButtonText(e.target.value)} className="h-9 flex-1 font-mono text-xs" />
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-28 text-xs">Input border</Label>
              <Input type="color" value={inputBorderColor} onChange={(e) => setInputBorderColor(e.target.value)} className="h-9 w-16 p-1" />
              <Input value={inputBorderColor} onChange={(e) => setInputBorderColor(e.target.value)} className="h-9 flex-1 font-mono text-xs" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h2 className="text-sm font-medium">Borders & corners</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="w-28 text-xs">Width (px)</Label>
              <Input type="number" min={0} value={borderWidth} onChange={(e) => setBorderWidth(Number(e.target.value) || 0)} className="h-9" />
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-28 text-xs">Style</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={borderStyle}
                onChange={(e) => setBorderStyle(e.target.value as "solid" | "dashed" | "none")}
              >
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="none">None</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-28 text-xs">Radius (px)</Label>
              <input
                type="range"
                min={0}
                max={24}
                value={borderRadius}
                onChange={(e) => setBorderRadius(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-xs w-6">{borderRadius}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h2 className="text-sm font-medium">Typography</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="w-28 text-xs">Font</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
              >
                {FONT_OPTIONS.map((o) => (
                  <option key={o.value || "default"} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-28 text-xs">Size (px)</Label>
              <input type="range" min={12} max={24} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="flex-1" />
              <span className="text-xs w-6">{fontSize}</span>
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-28 text-xs">Weight</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={fontWeight}
                onChange={(e) => setFontWeight(e.target.value as "400" | "500" | "600" | "700")}
              >
                <option value="400">400</option>
                <option value="500">500</option>
                <option value="600">600</option>
                <option value="700">700</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h2 className="text-sm font-medium">Spacing</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="w-28 text-xs">Padding (px)</Label>
              <input type="range" min={0} max={32} value={padding} onChange={(e) => setPadding(Number(e.target.value))} className="flex-1" />
              <span className="text-xs w-6">{padding}</span>
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-28 text-xs">Gap (px)</Label>
              <input type="range" min={0} max={24} value={gap} onChange={(e) => setGap(Number(e.target.value))} className="flex-1" />
              <span className="text-xs w-6">{gap}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h2 className="text-sm font-medium">Custom CSS</h2>
          </CardHeader>
          <CardContent>
            <textarea
              value={customCss}
              onChange={(e) => setCustomCss(e.target.value)}
              placeholder="Any extra CSS..."
              className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-xs font-mono"
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
            <Button variant="default" size="sm" onClick={saveToTheme}>
              Save to theme
            </Button>
          </CardContent>
        </Card>
      </aside>

      <div className="flex-1 min-w-0">
        <Card>
          <CardHeader className="pb-2">
            <h2 className="text-sm font-medium">Live preview</h2>
            <p className="text-xs text-muted-foreground">Preview only; form submission will not work.</p>
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
  );
}
