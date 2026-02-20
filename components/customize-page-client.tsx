"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Save,
  Copy,
  RotateCcw,
  Code,
  Paintbrush,
  Eye,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Default values extracted from the Nuvei "hot-ice" theme CSS        */
/* ------------------------------------------------------------------ */

const DEFAULTS = {
  pageBg: "#22243C",
  textColor: "#ffffff",
  accentColor: "#6794FF",
  cardBg: "#343457",
  headerBg: "#404064",
  mutedColor: "#7083AF",
  successColor: "#76B300",
  errorColor: "#F3554F",

  submitBg: "#6794FF",
  submitText: "#ffffff",
  submitRadius: "4rem",
  submitFontSize: "1.8rem",

  inputBorderColor: "#7083AF",
  inputTextColor: "#ffffff",
  inputFontSize: "1.4rem",
  inputBg: "transparent",

  fontFamily: "Roboto, sans-serif",
  baseFontSize: "10px",

  lightboxBg: "#22243C",
  lightboxHeaderBg: "#404064",
  lightboxHeaderText: "#ffffff",
  lightboxContentText: "#ffffff",

  bodyMaxWidth: "85rem",
  bodyPadding: ".5rem 1.5rem",
  bodyMinWidth: "30rem",
};

type ThemeValues = typeof DEFAULTS;

/* ------------------------------------------------------------------ */
/*  CSS generation from control values                                 */
/* ------------------------------------------------------------------ */

function buildCssFromValues(v: ThemeValues): string {
  return `/* Nuvei Cashier Theme Overrides */

:root {
  --box-shadow-color: ${v.mutedColor};
  font-size: ${v.baseFontSize};
  font-family: ${v.fontFamily};
  background: ${v.pageBg};
  color: ${v.textColor};
}

body {
  font-family: ${v.fontFamily};
  max-width: ${v.bodyMaxWidth};
  min-width: ${v.bodyMinWidth};
  padding: ${v.bodyPadding};
}

/* Submit / Continue button */
.submit, #continueButton {
  background: ${v.submitBg};
}

#continueButton {
  color: ${v.submitText};
  font-size: ${v.submitFontSize};
  border-radius: ${v.submitRadius};
  background: ${v.submitBg};
}

#continueButton:hover {
  opacity: .8;
}

/* Form inputs */
input, .cSelect > div {
  border-color: ${v.inputBorderColor};
  color: ${v.inputTextColor};
  font-size: ${v.inputFontSize};
  background: ${v.inputBg};
}

input:focus, .cSelect > div:focus {
  box-shadow: 0 .1rem 0 ${v.mutedColor};
}

/* Labels */
label, .label {
  color: ${v.mutedColor};
}

/* Links */
.PMINFO a, .pm-hint a, #lightbox a, #lightbox_ws a {
  color: ${v.accentColor};
}

/* Cards / Panels */
.pm_details_wrap .pminfo_wrap {
  background-color: ${v.cardBg};
  border-radius: .4rem;
  box-shadow: 0 .3rem .6rem 0 rgba(15,15,26,0.3);
}

/* Payment method list items */
[data-pms-type="vertical"] ul.pm-list > li {
  background-color: ${v.cardBg};
  border-color: ${v.cardBg};
}

[data-pms-type="vertical"] ul.pm-list > li.selected {
  border-color: ${v.accentColor};
  background: ${v.cardBg};
}

/* Lightbox / Modal */
#lightbox, #lightbox_ws {
  background: ${v.lightboxBg};
}

.lightbox-header {
  background: ${v.lightboxHeaderBg};
}

.lightbox-header h2 {
  color: ${v.lightboxHeaderText};
}

.lightbox-content {
  color: ${v.lightboxContentText};
}

.lightbox-content p {
  color: ${v.lightboxContentText};
}

/* Checkboxes / toggles */
#allowSaveUpo:checked + label span,
#sccToggle:checked + label span,
.directFlowCheckbox:checked + label span {
  border-color: ${v.accentColor};
  background-color: ${v.accentColor};
}

/* Success / Error / Validation */
.success .lightbox-header h2, #lightbox.success .lightbox-header h2 {
  color: ${v.successColor};
}

.error .lightbox-header h2, .error-suggest .lightbox-header h2 {
  color: ${v.errorColor};
}

.valid input, .valid select, .valid .cSelect div {
  border-color: ${v.successColor};
}

.invalid input, .invalid select, .invalid .cSelect div {
  border-color: ${v.errorColor};
}

label.error {
  background: ${v.errorColor};
}

label.error:before {
  border-bottom-color: ${v.errorColor};
}

/* Scrollbar */
.scrollable .iScrollIndicator {
  background: ${v.mutedColor};
}

.iScrollVerticalScrollbar {
  background: ${v.headerBg};
}

/* Policy footer */
.policy-footer {
  border-top-color: ${v.headerBg};
}

.policy-footer .secure-payment,
.policy-footer .cards-footer-info {
  color: ${v.mutedColor};
}

/* Suggested amount buttons */
.payment_amount .suggested-points .spoint {
  color: ${v.accentColor};
  border-color: ${v.accentColor};
}

.payment_amount .suggested-points .spoint.selected {
  background: ${v.accentColor};
  color: ${v.submitText};
}

/* Tooltip */
.tooltip:before {
  color: ${v.accentColor};
}

.tooltip_hint {
  background-color: ${v.accentColor};
}

.tooltip_hint:after {
  border-top-color: ${v.accentColor};
}

/* Loader ring */
.lds-ring div {
  border-color: ${v.accentColor} transparent transparent transparent;
}

/* DCC container */
.dcc_container {
  background-color: ${v.cardBg};
}

/* Fixed amount */
.wd_fixed_amount .fixed-amount-container {
  background-color: ${v.headerBg};
  color: ${v.textColor};
}

/* Store CC details */
#store-cc-details {
  background: ${v.lightboxContentText === "#ffffff" ? "#FFFFFF" : "#FFFFFF"};
  color: #808080;
}`;
}

/* ------------------------------------------------------------------ */
/*  Collapsible section                                                */
/* ------------------------------------------------------------------ */

function Section({
  title,
  icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors"
      >
        {icon}
        <span className="flex-1 text-left">{title}</span>
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {open && <div className="px-4 pb-4 space-y-3 border-t border-border">{children}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Color picker row                                                   */
/* ------------------------------------------------------------------ */

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <label className="text-xs text-muted-foreground w-[130px] shrink-0 truncate" title={label}>
        {label}
      </label>
      <div className="relative flex items-center gap-2 flex-1">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-8 rounded border border-border cursor-pointer shrink-0 bg-transparent"
          style={{ padding: 0 }}
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 text-xs font-mono flex-1"
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Text input row                                                     */
/* ------------------------------------------------------------------ */

function TextRow({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <label className="text-xs text-muted-foreground w-[130px] shrink-0 truncate" title={label}>
        {label}
      </label>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 text-xs font-mono flex-1"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Select row                                                         */
/* ------------------------------------------------------------------ */

function SelectRow({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <label className="text-xs text-muted-foreground w-[130px] shrink-0 truncate" title={label}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-8 flex-1 rounded-md border border-input bg-background px-2 text-xs"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

type Props = {
  themeId: string;
  initialCss: string;
};

function tryParseValues(css: string): Partial<ThemeValues> | null {
  if (!css.trim()) return null;
  const parsed: Partial<ThemeValues> = {};
  const extract = (pattern: RegExp): string | null => {
    const m = css.match(pattern);
    return m ? m[1].trim() : null;
  };

  const mappings: [keyof ThemeValues, RegExp][] = [
    ["pageBg", /:root\s*\{[^}]*background:\s*([^;]+)/],
    ["textColor", /:root\s*\{[^}]*\bcolor:\s*([^;]+)/],
    ["accentColor", /\.submit[^{]*\{[^}]*background:\s*([^;]+)/],
    ["mutedColor", /--box-shadow-color:\s*([^;]+)/],
    ["baseFontSize", /:root\s*\{[^}]*font-size:\s*([^;]+)/],
  ];

  let found = false;
  for (const [key, re] of mappings) {
    const val = extract(re);
    if (val) {
      (parsed as Record<string, string>)[key] = val;
      found = true;
    }
  }
  return found ? parsed : null;
}

export function CustomizePageClient({ themeId, initialCss }: Props) {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const initialValues = useMemo(() => {
    const restored = tryParseValues(initialCss);
    return { ...DEFAULTS, ...restored };
  }, [initialCss]);

  const [values, setValues] = useState<ThemeValues>(initialValues);
  const [showRawCss, setShowRawCss] = useState(false);
  const [rawCssOverride, setRawCssOverride] = useState("");
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<"saved" | "error" | null>(null);

  const generatedCss = useMemo(() => buildCssFromValues(values), [values]);

  const finalCss = showRawCss && rawCssOverride.trim()
    ? generatedCss + "\n\n/* Raw CSS overrides */\n" + rawCssOverride
    : generatedCss;

  const sendCssToIframe = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (win) win.postMessage({ type: "custom-css", css: finalCss }, "*");
  }, [finalCss]);

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

      const hostedUrl = data.url as string;
      setIframeUrl(
        "/api/theme-preview?url=" + encodeURIComponent(hostedUrl)
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [themeId]);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  const handleIframeLoad = () => sendCssToIframe();

  const update = useCallback((key: keyof ThemeValues, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetAll = useCallback(() => {
    setValues(DEFAULTS);
    setRawCssOverride("");
    setSaveMessage(null);
  }, []);

  const saveCss = useCallback(async () => {
    setSaveMessage(null);
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ default_theme_custom_css: finalCss }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaveMessage("saved");
      router.refresh();
    } catch {
      setSaveMessage("error");
    } finally {
      setSaving(false);
    }
  }, [finalCss, router]);

  const copyCss = () => {
    navigator.clipboard.writeText(finalCss);
  };

  const fontOptions = [
    { value: "Roboto, sans-serif", label: "Roboto" },
    { value: "Arial, Helvetica, sans-serif", label: "Arial" },
    { value: "Helvetica, Arial, sans-serif", label: "Helvetica" },
    { value: "'Segoe UI', Tahoma, Geneva, sans-serif", label: "Segoe UI" },
    { value: "'Inter', sans-serif", label: "Inter" },
    { value: "'Open Sans', sans-serif", label: "Open Sans" },
    { value: "system-ui, sans-serif", label: "System UI" },
    { value: "Georgia, serif", label: "Georgia" },
    { value: "'Courier New', monospace", label: "Courier New" },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b border-border">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>

        <div className="flex items-center gap-2 mr-auto">
          <Paintbrush className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Theme Customizer</h1>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
            ID: {themeId}
          </span>
        </div>

        <Button variant="outline" size="sm" className="gap-1.5" onClick={resetAll}>
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={copyCss}>
          <Copy className="h-3.5 w-3.5" />
          Copy CSS
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setShowRawCss(!showRawCss)}
        >
          <Code className="h-3.5 w-3.5" />
          {showRawCss ? "Hide Raw CSS" : "Raw CSS"}
        </Button>
        <Button size="sm" className="gap-1.5" onClick={saveCss} disabled={saving}>
          <Save className="h-3.5 w-3.5" />
          {saving ? "Saving..." : "Save"}
        </Button>
        {saveMessage === "saved" && (
          <span className="text-xs text-green-500 font-medium">Saved!</span>
        )}
        {saveMessage === "error" && (
          <span className="text-xs text-destructive font-medium">Failed to save</span>
        )}
      </div>

      {/* Main content: sidebar + preview */}
      <div className="flex flex-1 gap-4 min-h-0">
        {/* Controls sidebar */}
        <aside className="w-[340px] xl:w-[380px] shrink-0 overflow-y-auto space-y-2 pr-2 pb-4">
          {/* Colors */}
          <Section
            title="Colors"
            defaultOpen={true}
            icon={<div className="h-3.5 w-3.5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600" />}
          >
            <ColorRow label="Page background" value={values.pageBg} onChange={(v) => update("pageBg", v)} />
            <ColorRow label="Text color" value={values.textColor} onChange={(v) => update("textColor", v)} />
            <ColorRow label="Accent / Primary" value={values.accentColor} onChange={(v) => update("accentColor", v)} />
            <ColorRow label="Card background" value={values.cardBg} onChange={(v) => update("cardBg", v)} />
            <ColorRow label="Header / Borders" value={values.headerBg} onChange={(v) => update("headerBg", v)} />
            <ColorRow label="Muted / Labels" value={values.mutedColor} onChange={(v) => update("mutedColor", v)} />
            <ColorRow label="Success" value={values.successColor} onChange={(v) => update("successColor", v)} />
            <ColorRow label="Error" value={values.errorColor} onChange={(v) => update("errorColor", v)} />
          </Section>

          {/* Typography */}
          <Section
            title="Typography"
            icon={<span className="text-xs font-bold text-muted-foreground">Aa</span>}
          >
            <SelectRow
              label="Font family"
              value={values.fontFamily}
              onChange={(v) => update("fontFamily", v)}
              options={fontOptions}
            />
            <TextRow
              label="Base font size"
              value={values.baseFontSize}
              onChange={(v) => update("baseFontSize", v)}
              placeholder="10px"
            />
          </Section>

          {/* Buttons */}
          <Section
            title="Buttons"
            icon={<div className="h-3 w-6 rounded-full bg-primary/60" />}
          >
            <ColorRow label="Background" value={values.submitBg} onChange={(v) => update("submitBg", v)} />
            <ColorRow label="Text color" value={values.submitText} onChange={(v) => update("submitText", v)} />
            <TextRow
              label="Border radius"
              value={values.submitRadius}
              onChange={(v) => update("submitRadius", v)}
              placeholder="4rem"
            />
            <TextRow
              label="Font size"
              value={values.submitFontSize}
              onChange={(v) => update("submitFontSize", v)}
              placeholder="1.8rem"
            />
          </Section>

          {/* Form Inputs */}
          <Section
            title="Form Inputs"
            icon={<div className="h-3 w-6 rounded border border-muted-foreground/40" />}
          >
            <ColorRow label="Border color" value={values.inputBorderColor} onChange={(v) => update("inputBorderColor", v)} />
            <ColorRow label="Text color" value={values.inputTextColor} onChange={(v) => update("inputTextColor", v)} />
            <TextRow
              label="Background"
              value={values.inputBg}
              onChange={(v) => update("inputBg", v)}
              placeholder="transparent"
            />
            <TextRow
              label="Font size"
              value={values.inputFontSize}
              onChange={(v) => update("inputFontSize", v)}
              placeholder="1.4rem"
            />
          </Section>

          {/* Modal / Lightbox */}
          <Section
            title="Modal / Lightbox"
            icon={<div className="h-3.5 w-3.5 rounded border border-muted-foreground/40 bg-muted/50" />}
          >
            <ColorRow label="Background" value={values.lightboxBg} onChange={(v) => update("lightboxBg", v)} />
            <ColorRow label="Header background" value={values.lightboxHeaderBg} onChange={(v) => update("lightboxHeaderBg", v)} />
            <ColorRow label="Header text" value={values.lightboxHeaderText} onChange={(v) => update("lightboxHeaderText", v)} />
            <ColorRow label="Content text" value={values.lightboxContentText} onChange={(v) => update("lightboxContentText", v)} />
          </Section>

          {/* Layout */}
          <Section
            title="Layout"
            icon={<div className="h-3 w-5 rounded border border-dashed border-muted-foreground/40" />}
          >
            <TextRow
              label="Max width"
              value={values.bodyMaxWidth}
              onChange={(v) => update("bodyMaxWidth", v)}
              placeholder="85rem"
            />
            <TextRow
              label="Min width"
              value={values.bodyMinWidth}
              onChange={(v) => update("bodyMinWidth", v)}
              placeholder="30rem"
            />
            <TextRow
              label="Body padding"
              value={values.bodyPadding}
              onChange={(v) => update("bodyPadding", v)}
              placeholder=".5rem 1.5rem"
            />
          </Section>

          {/* Raw CSS override editor */}
          {showRawCss && (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-3 text-sm font-medium flex items-center gap-2 border-b border-border bg-muted/30">
                <Code className="h-3.5 w-3.5 text-muted-foreground" />
                Raw CSS Override
              </div>
              <div className="p-3">
                <p className="text-[11px] text-muted-foreground mb-2">
                  Additional CSS appended after generated rules. Use for fine-grained overrides.
                </p>
                <textarea
                  value={rawCssOverride}
                  onChange={(e) => setRawCssOverride(e.target.value)}
                  placeholder={".my-selector {\n  property: value;\n}"}
                  className="w-full min-h-[160px] rounded-md border border-input bg-background px-3 py-2 text-[11px] font-mono resize-y"
                  spellCheck={false}
                />
              </div>
            </div>
          )}

          {/* Generated CSS preview */}
          {showRawCss && (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-3 text-sm font-medium flex items-center gap-2 border-b border-border bg-muted/30">
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                Generated CSS
              </div>
              <div className="p-3">
                <pre className="text-[10px] font-mono text-muted-foreground overflow-x-auto max-h-[300px] overflow-y-auto whitespace-pre-wrap">
                  {finalCss}
                </pre>
              </div>
            </div>
          )}
        </aside>

        {/* Live preview */}
        <div className="flex-1 min-w-0 flex flex-col border border-border rounded-lg overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-2 bg-muted/30 border-b border-border shrink-0">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-400/60" />
              <div className="h-3 w-3 rounded-full bg-yellow-400/60" />
              <div className="h-3 w-3 rounded-full bg-green-400/60" />
            </div>
            <span className="text-xs text-muted-foreground flex-1 truncate">
              Nuvei Payment Page Preview
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={loadPreview}
              disabled={loading}
            >
              <RotateCcw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Loading..." : "Reload"}
            </Button>
          </div>

          <div className="flex-1 bg-muted/10 relative">
            {error && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6 max-w-sm text-center">
                  <p className="text-sm text-destructive font-medium mb-3">{error}</p>
                  <Button size="sm" variant="outline" onClick={loadPreview}>
                    Retry
                  </Button>
                </div>
              </div>
            )}

            {iframeUrl ? (
              <iframe
                ref={iframeRef}
                src={iframeUrl}
                title="Payment page preview"
                className="w-full h-full min-h-[400px] border-0"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                onLoad={handleIframeLoad}
              />
            ) : !error ? (
              <div className="absolute inset-0 flex items-center justify-center">
                {loading ? (
                  <div className="text-center space-y-3">
                    <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-muted-foreground">Loading payment page...</p>
                  </div>
                ) : (
                  <div className="text-center space-y-3">
                    <Eye className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      Preview will appear here
                    </p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
