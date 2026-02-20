"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeCustomizer } from "@/components/theme-customizer";
import { useAdmin } from "@/contexts/admin-context";
import type { ThemeRecord } from "@/lib/types";
import { ArrowLeft } from "lucide-react";

type Props = {
  defaultThemeId: string | null;
  theme: ThemeRecord | null;
};

export function CustomizePageClient({
  defaultThemeId,
  theme,
}: Props) {
  const router = useRouter();
  const { isAdmin } = useAdmin();
  const [themeIdInput, setThemeIdInput] = useState(defaultThemeId ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<"saved" | "error" | null>(null);

  const saveDefaultThemeId = useCallback(async () => {
    const id = themeIdInput.trim();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ default_theme_id: id || null }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setMessage("saved");
      router.refresh();
    } catch {
      setMessage("error");
    } finally {
      setSaving(false);
    }
  }, [themeIdInput, router]);

  if (defaultThemeId == null || defaultThemeId === "") {
    if (!isAdmin) {
      return (
        <div>
          <div className="flex items-center gap-4 mb-6">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>
          <Card>
            <CardHeader>
              <h1 className="text-xl font-semibold">Customize default theme</h1>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                No default theme is set. An admin can set the default theme ID in
                settings to customize it here.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }
    return (
      <div>
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold">Customize default theme</h1>
        </div>
        <Card className="max-w-lg">
          <CardHeader>
            <h2 className="text-lg font-medium">Set default theme ID</h2>
            <p className="text-sm text-muted-foreground">
              Enter the Nuvei theme_id of the default theme to customize (e.g. 223482).
              Only this theme can be customized from this page.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="default-theme-id">Default theme ID</Label>
              <Input
                id="default-theme-id"
                value={themeIdInput}
                onChange={(e) => setThemeIdInput(e.target.value)}
                placeholder="e.g. 223482"
                className="font-mono"
              />
            </div>
            <Button onClick={saveDefaultThemeId} disabled={saving}>
              {saving ? "Saving…" : "Save and open customizer"}
            </Button>
            {message === "saved" && (
              <p className="text-sm text-green-600">Saved. Reloading…</p>
            )}
            {message === "error" && (
              <p className="text-sm text-destructive">Failed to save.</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (theme == null) {
    return (
      <div>
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold">Customize default theme</h1>
        </div>
        <Card>
          <CardHeader>
            <h2 className="text-lg font-medium">Theme not in catalog</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Default theme ID is set to <strong className="font-mono">{defaultThemeId}</strong>,
              but there is no theme in the catalog with this ID. Add a theme with this
              theme_id from the Catalog, or change the default theme ID below.
            </p>
            {isAdmin && (
              <div className="pt-4 border-t space-y-2">
                <Label htmlFor="default-theme-id-change">Change default theme ID</Label>
                <div className="flex gap-2">
                  <Input
                    id="default-theme-id-change"
                    value={themeIdInput}
                    onChange={(e) => setThemeIdInput(e.target.value)}
                    placeholder="e.g. 223482"
                    className="font-mono max-w-xs"
                  />
                  <Button onClick={saveDefaultThemeId} disabled={saving} variant="secondary">
                    {saving ? "Saving…" : "Save"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold">Customize: {theme.name}</h1>
        <p className="text-muted-foreground text-sm">Theme ID: {theme.theme_id}</p>
      </div>
      <ThemeCustomizer theme={theme} />
    </div>
  );
}
