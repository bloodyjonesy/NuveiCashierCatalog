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

const VALUE_LABELS: Record<keyof ThemeValues, string> = {
  pageBg: "Page background",
  textColor: "Text color",
  accentColor: "Accent / Primary",
  cardBg: "Card background",
  headerBg: "Header / Borders",
  mutedColor: "Muted / Labels",
  successColor: "Success color",
  errorColor: "Error color",
  submitBg: "Button background",
  submitText: "Button text color",
  submitRadius: "Button border radius",
  submitFontSize: "Button font size",
  inputBorderColor: "Input border color",
  inputTextColor: "Input text color",
  inputFontSize: "Input font size",
  inputBg: "Input background",
  fontFamily: "Font family",
  baseFontSize: "Base font size",
  lightboxBg: "Modal background",
  lightboxHeaderBg: "Modal header background",
  lightboxHeaderText: "Modal header text",
  lightboxContentText: "Modal content text",
  bodyMaxWidth: "Body max width",
  bodyPadding: "Body padding",
  bodyMinWidth: "Body min width",
};

const VALUE_CSS_INFO: Record<keyof ThemeValues, { selector: string; property: string }> = {
  pageBg:              { selector: ":root",                          property: "background" },
  textColor:           { selector: ":root",                          property: "color" },
  accentColor:         { selector: ".PMINFO a, .pm-hint a",          property: "color" },
  cardBg:              { selector: ".pm_details_wrap .pminfo_wrap",   property: "background-color" },
  headerBg:            { selector: ".lightbox-header",               property: "background" },
  mutedColor:          { selector: "label, .label",                  property: "color" },
  successColor:        { selector: ".valid input",                   property: "border-color" },
  errorColor:          { selector: ".invalid input",                 property: "border-color" },
  submitBg:            { selector: "#continueButton",                property: "background" },
  submitText:          { selector: "#continueButton",                property: "color" },
  submitRadius:        { selector: "#continueButton",                property: "border-radius" },
  submitFontSize:      { selector: "#continueButton",                property: "font-size" },
  inputBorderColor:    { selector: "input, .cSelect > div",          property: "border-color" },
  inputTextColor:      { selector: "input, .cSelect > div",          property: "color" },
  inputFontSize:       { selector: "input, .cSelect > div",          property: "font-size" },
  inputBg:             { selector: "input, .cSelect > div",          property: "background" },
  fontFamily:          { selector: ":root, body",                    property: "font-family" },
  baseFontSize:        { selector: ":root",                          property: "font-size" },
  lightboxBg:          { selector: "#lightbox, #lightbox_ws",        property: "background" },
  lightboxHeaderBg:    { selector: ".lightbox-header",               property: "background" },
  lightboxHeaderText:  { selector: ".lightbox-header h2",            property: "color" },
  lightboxContentText: { selector: ".lightbox-content",              property: "color" },
  bodyMaxWidth:        { selector: "body",                           property: "max-width" },
  bodyPadding:         { selector: "body",                           property: "padding" },
  bodyMinWidth:        { selector: "body",                           property: "min-width" },
};

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

/* Button / Link base */
.btn, .payment_amount .suggested-points .spoint {
  color: ${v.textColor};
}

/* Form inputs */
input, .cSelect > div, .cSelect_read_only_text, .readOnlyText {
  border-color: ${v.inputBorderColor};
  color: ${v.inputTextColor};
  font-size: ${v.inputFontSize};
  background: ${v.inputBg};
}

input:focus, .cSelect > div:focus {
  box-shadow: 0 .1rem 0 ${v.mutedColor};
}

input:disabled, input[readonly], .cSelect_read_only_text,
.cSelect.select-disabled > div, #continueButton:disabled {
  color: ${v.mutedColor};
}

/* Labels */
label, .label {
  color: ${v.mutedColor};
}

/* Links */
.PMINFO a, .pm-hint a, #lightbox a, #lightbox_ws a,
.blockUI h1 span,
#lightbox.mvp_nuvei_card a.enter_card_detail,
#lightbox.wd_mvp_nuvei_card a.enter_card_detail {
  color: ${v.accentColor};
}

/* PMINFO text */
.PMINFO {
  color: ${v.textColor};
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

/* Bank selector */
.ob_bank_id-widget [data-ob-bank] {
  border-color: ${v.headerBg};
}

.ob_bank_id-widget [data-ob-bank].active {
  border-color: ${v.accentColor};
}

/* Amount container */
#pm_amount-container {
  background-color: ${v.pageBg};
}

/* Amount wrap: default border and labels */
.amount_wrap .amount-container {
  border-bottom-color: ${v.mutedColor};
}

.label_open_amount_range,
.withdraw-limit-text {
  color: ${v.mutedColor};
}

.amount_wrap .revert_currency,
.amount_wrap .revert_currency:before {
  color: ${v.mutedColor};
}

.pt_currency_exchange_wrapper .converted-amount-text {
  color: ${v.mutedColor};
}

/* Fixed amount display area and label */
.fixed_amount .amount_container_wrap {
  background-color: ${v.headerBg};
}

.fixed-amount-label,
.wd_fixed_amount .fixed-amount-label {
  color: ${v.mutedColor};
}

/* Amount validation */
.amount_wrap .invalid .amount-container {
  border-color: ${v.errorColor};
}

.amount_wrap .valid .amount-container {
  border-color: ${v.successColor};
}

/* Left column: payment method list header */
[data-pms-type="vertical"] .payment_header {
  background-color: ${v.pageBg};
  color: ${v.textColor};
  border-bottom-color: ${v.headerBg};
}

/* Payment list group indicator bar */
[data-pms-type="vertical"] ul.pm-list > li[data-group]::before {
  background-color: ${v.cardBg};
}

[data-pms-type="vertical"] ul.pm-list > li[data-group].selected::before {
  background-color: ${v.accentColor};
}

/* Apple Pay / wallet block in left column */
[data-pms-type="vertical"] .apple_pay_wrapp {
  background-color: ${v.pageBg};
  color: ${v.mutedColor};
}

[data-pms-type="vertical"] .apple_pay_wrapp .or_separator {
  color: ${v.headerBg};
  background-color: ${v.pageBg};
}

[data-pms-type="vertical"] .apple_pay_wrapp .or_separator:after {
  background-color: ${v.headerBg};
}

[data-pms-type="vertical"] .apple_pay_wrapp .btn_container {
  background-color: ${v.cardBg};
  border-color: ${v.cardBg};
}

[data-pms-type="vertical"] .apple_pay_wrapp .apple.selected .btn_container {
  border-color: ${v.accentColor};
  color: ${v.textColor};
}

[data-pms-type="vertical"] .apple_pay_wrapp .other .text {
  color: ${v.textColor};
}

/* Back button in header */
.head #back_btn_wrapper a {
  color: ${v.textColor};
}

/* Dropdown select options */
.cSelect > select > option {
  background: ${v.cardBg};
  color: ${v.textColor};
}

/* Card arts / custom card image row */
.row.cardArtsUrl {
  background-color: ${v.headerBg};
}

/* Remove saved PM button */
.removeUPM {
  background-color: ${v.headerBg};
  color: ${v.accentColor};
}

/* Merchant name / address */
#merchent_name_and_address_container {
  color: ${v.mutedColor};
}

/* Withdraw / payout section */
.withdraw-wrapper table tr {
  border-bottom-color: ${v.headerBg};
}

.withdraw-wrapper table tr:first-child {
  border-top-color: ${v.headerBg};
}

.withdraw-wrapper .wd_upo_name {
  color: ${v.mutedColor};
}

.no_pending_withdrawals {
  color: ${v.mutedColor};
}

/* Scan card CTA */
.scan_text {
  color: ${v.mutedColor};
}

.cta_scan_card {
  border-color: ${v.accentColor};
  color: ${v.accentColor};
}

/* Registration / lightbox details panel */
#lightbox.registration .details,
#lightbox_ws.registration .details {
  background: ${v.headerBg};
}

/* Lightbox try_pm borders */
#lightbox .lightbox-content .try_pm,
#lightbox_ws .lightbox-content .try_pm {
  border-bottom-color: ${v.headerBg};
}

#lightbox .lightbox-content .try_pm > div,
#lightbox_ws .lightbox-content .try_pm > div {
  border-top-color: ${v.headerBg};
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

.lightbox-content .hint {
  color: ${v.lightboxContentText};
}

.lightbox-content .try_pm > div:hover {
  background: ${v.headerBg};
}

/* Checkboxes / toggles */
#allowSaveUpo + label,
#sccToggle + label,
#paypalDirectFlow + label,
.directFlowCheckbox + label,
#skrillDirectFlow + label {
  color: ${v.textColor};
}

#allowSaveUpo:checked + label span,
#sccToggle:checked + label span,
.directFlowCheckbox:checked + label span {
  border-color: ${v.accentColor};
  background-color: ${v.accentColor};
}

/* Radio buttons */
.c2p_card input[type="radio"] + label:before {
  border-color: ${v.accentColor};
}

.c2p_card input[type="radio"]:checked + label:after {
  background-color: ${v.accentColor};
}

/* C2P / Click-to-pay text */
.c2p_card .text-container h3,
.c2p_card .text-container p,
.c2p-show-more-cards-btn {
  color: ${v.textColor};
}

/* Success / Error / Validation */
.success .lightbox-header h2, #lightbox.success .lightbox-header h2 {
  color: ${v.successColor};
}

.error .lightbox-header h2, .error-suggest .lightbox-header h2 {
  color: ${v.errorColor};
}

.valid input, .valid select, .valid .amount-container input, .valid .cSelect div {
  border-color: ${v.successColor};
}

.valid input:focus, .valid .cSelect > div:focus {
  box-shadow: 0 .1rem 0 ${v.successColor};
}

.invalid input, .invalid select, .invalid .amount-container input, .invalid .cSelect div {
  border-color: ${v.errorColor};
}

.invalid input:focus, .invalid .cSelect > div:focus {
  box-shadow: 0 .1rem 0 ${v.errorColor};
}

.cSelect > div.unsuitable {
  color: ${v.errorColor};
}

label.error {
  background: ${v.errorColor};
}

label.error:before {
  border-bottom-color: ${v.errorColor};
}

/* Validation toggle tooltip */
.row.toggleable_validation.validation_off .tooltip::before {
  color: ${v.errorColor};
}

/* Field help icon */
.row .field_help .tooltip_content {
  color: ${v.mutedColor};
}

/* Scrollbar */
.scrollable .iScrollIndicator {
  background: ${v.mutedColor};
}

.scrollable .iScrollLoneScrollbar,
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

/* Secure tooltip */
.secure_tooltip_wrapper {
  background: ${v.pageBg};
}

.secure_tooltip_wrapper:after {
  border-top-color: ${v.pageBg};
}

/* Block UI overlay */
.blockUI h1 {
  color: ${v.textColor};
}

/* Target iframe */
.targetIframeWrap {
  color: ${v.textColor};
}

/* Pending states */
#lightbox.pending .lightbox-header h2,
#lightbox_ws.pending .lightbox-header h2,
.pending .lightbox-header h2 {
  color: ${v.lightboxHeaderText};
}

/* SCC popup */
#lightbox.lbx_scc_popup .lightbox-content .scc-header {
  border-bottom-color: ${v.mutedColor};
  color: ${v.textColor};
}

#lightbox.lbx_scc_popup .lightbox-content .scc_popup_footer {
  border-top-color: ${v.mutedColor};
}

/* Card arts / edit button */
.row.cardArtsUrl .vco_edit .v-button,
.row.cardArtsUrl .vco_edit .v-button:before {
  color: ${v.mutedColor};
}

/* Phone number selects */
.PMINFO .row.qiwi_phonenumber .cSelect > div.first_option,
.PMINFO .row.composite_phone_wrap .cSelect > div.first_option,
.PMINFO .row.muchBetter_mobilePhone .cSelect > div.first_option {
  color: ${v.textColor};
}

/* Store CC details */
#store-cc-details {
  background: #FFFFFF;
  color: #808080;
}`;
}

/**
 * Post-process CSS to add !important to every declaration value.
 * This ensures our overrides win against the Nuvei page's own stylesheets
 * regardless of specificity or cascade order.
 */
function addImportant(css: string): string {
  return css.replace(
    /:\s*([^;}{!]+)\s*;/g,
    (match, value) => {
      const trimmed = value.trim();
      if (trimmed.includes("!important")) return match;
      return `: ${trimmed} !important;`;
    }
  );
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

  const generatedCss = useMemo(() => addImportant(buildCssFromValues(values)), [values]);

  const finalCss = showRawCss && rawCssOverride.trim()
    ? generatedCss + "\n\n/* Raw CSS overrides */\n" + addImportant(rawCssOverride)
    : generatedCss;

  const changedEntries = useMemo(() => {
    const entries: { key: keyof ThemeValues; label: string; from: string; to: string }[] = [];
    for (const k of Object.keys(DEFAULTS) as (keyof ThemeValues)[]) {
      if (values[k] !== DEFAULTS[k]) {
        entries.push({ key: k, label: VALUE_LABELS[k], from: DEFAULTS[k], to: values[k] });
      }
    }
    return entries;
  }, [values]);

  const sendCssToIframe = useCallback(() => {
    const iframe = iframeRef.current;
    const win = iframe?.contentWindow;
    if (!win) {
      console.warn("[customizer] sendCss: no iframe contentWindow");
      return;
    }
    console.log("[customizer] sendCss: posting CSS to iframe, length=", finalCss.length);
    win.postMessage({ type: "custom-css", css: finalCss }, "*");
  }, [finalCss]);

  useEffect(() => {
    sendCssToIframe();
  }, [sendCssToIframe]);

  const loadPreview = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      console.log("[customizer] loadPreview: fetching hosted URL for theme", themeId);
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
      const proxyUrl = "/api/theme-preview?url=" + encodeURIComponent(hostedUrl);
      console.log("[customizer] loadPreview: hostedUrl=", hostedUrl);
      console.log("[customizer] loadPreview: proxyUrl=", proxyUrl);
      setIframeUrl(proxyUrl);
    } catch (e) {
      console.error("[customizer] loadPreview error:", e);
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [themeId]);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  const handleIframeLoad = useCallback(() => {
    console.log("[customizer] iframe onLoad fired");
    sendCssToIframe();
    setTimeout(sendCssToIframe, 500);
    setTimeout(sendCssToIframe, 1500);
    setTimeout(sendCssToIframe, 3000);
  }, [sendCssToIframe]);

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

        {/* Right column: preview + changes */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {/* Live preview */}
          <div className="flex-1 min-h-0 flex flex-col border border-border rounded-lg overflow-hidden">
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

          {/* Changes summary for development */}
          <div className="shrink-0 border border-border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-b border-border">
              <div className="flex items-center gap-2">
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-medium">Changes for Development</span>
                {changedEntries.length > 0 && (
                  <span className="text-[10px] font-medium bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">
                    {changedEntries.length} change{changedEntries.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {changedEntries.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => {
                    const lines = changedEntries.map((e) => {
                      const info = VALUE_CSS_INFO[e.key];
                      return `${e.label}\n  Selector: ${info.selector}\n  Property: ${info.property}\n  Old:      ${e.from}\n  New:      ${e.to}`;
                    });
                    navigator.clipboard.writeText(lines.join("\n\n"));
                  }}
                >
                  <Copy className="h-3 w-3" />
                  Copy
                </Button>
              )}
            </div>
            <div className="px-4 py-3 max-h-[220px] overflow-y-auto">
              {changedEntries.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  No changes yet — adjust values in the sidebar to see a summary here.
                </p>
              ) : (
                <div className="space-y-3">
                  {changedEntries.map((e) => {
                    const info = VALUE_CSS_INFO[e.key];
                    return (
                      <div key={e.key} className="text-xs">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-medium">{e.label}</span>
                          {e.to.match(/^#[0-9a-fA-F]{3,8}$/) && (
                            <span
                              className="inline-block h-3 w-3 rounded-full border border-border shrink-0"
                              style={{ backgroundColor: e.to }}
                            />
                          )}
                        </div>
                        <div className="pl-3 space-y-0.5 text-muted-foreground">
                          <div>
                            <span className="text-muted-foreground/60 w-16 inline-block">Selector</span>
                            <code className="font-mono text-[10px] bg-muted px-1 py-0.5 rounded">{info.selector}</code>
                          </div>
                          <div>
                            <span className="text-muted-foreground/60 w-16 inline-block">Property</span>
                            <code className="font-mono text-[10px] bg-muted px-1 py-0.5 rounded">{info.property}</code>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-muted-foreground/60 w-16 inline-block">Value</span>
                            <code className="font-mono text-[10px] text-muted-foreground/70 line-through">{e.from}</code>
                            <span>→</span>
                            <code className="font-mono text-[10px] font-medium text-foreground">{e.to}</code>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
