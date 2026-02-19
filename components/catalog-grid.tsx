"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Trash2, Camera, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAdmin } from "@/contexts/admin-context";
import type { ThemeRecord } from "@/lib/types";

export function CatalogGrid() {
  const router = useRouter();
  const { isAdmin } = useAdmin();
  const [themes, setThemes] = useState<ThemeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [retakingId, setRetakingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const loadThemes = () => {
    fetch("/api/themes")
      .then((r) => r.json())
      .then((data) => setThemes(Array.isArray(data) ? data : []))
      .catch(() => setThemes([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadThemes();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (deletingId) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/themes/${id}`, { method: "DELETE" });
      if (res.ok) {
        setThemes((prev) => prev.filter((t) => t.id !== id));
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleRetakeScreenshot = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (retakingId) return;
    setRetakingId(id);
    try {
      const res = await fetch(`/api/themes/${id}/retake-screenshot`, { method: "POST" });
      if (res.ok) {
        const updated = await res.json();
        setThemes((prev) => prev.map((t) => (t.id === id ? updated : t)));
        router.refresh();
      }
    } finally {
      setRetakingId(null);
    }
  };

  const startRename = (e: React.MouseEvent, theme: ThemeRecord) => {
    e.preventDefault();
    setRenamingId(theme.id);
    setRenameValue(theme.name);
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameValue("");
  };

  const saveRename = async (id: string) => {
    const name = renameValue.trim();
    if (!name) {
      cancelRename();
      return;
    }
    try {
      const res = await fetch(`/api/themes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const updated = await res.json();
        setThemes((prev) => prev.map((t) => (t.id === id ? updated : t)));
        router.refresh();
      }
    } finally {
      cancelRename();
    }
  };

  if (loading) {
    return (
      <div className="text-muted-foreground py-12 text-center">
        Loading catalog…
      </div>
    );
  }

  if (themes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">
        <p className="mb-4">No themes yet.</p>
        {isAdmin && (
          <Link href="/add">
            <Button>Add your first theme</Button>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {themes.map((theme) => (
        <Card
          key={theme.id}
          className="overflow-hidden transition-shadow hover:shadow-md"
        >
          <Link href={`/theme/${theme.id}`} className="block">
            <div className="aspect-video bg-muted relative">
              {theme.screenshot_base64 ? (
                <img
                  src={`data:image/png;base64,${theme.screenshot_base64}`}
                  alt={theme.name}
                  className="object-cover w-full h-full"
                />
              ) : theme.screenshot_path ? (
                <img
                  src={theme.screenshot_path}
                  alt={theme.name}
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const fallback = e.currentTarget.nextElementSibling;
                    if (fallback) (fallback as HTMLElement).style.display = "flex";
                  }}
                />
              ) : null}
              <div
                className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm bg-muted"
                style={{
                  display: theme.screenshot_base64 || theme.screenshot_path ? "none" : "flex",
                }}
              >
                No preview
              </div>
            </div>
            <CardContent className="p-4">
              {isAdmin && renamingId === theme.id ? (
                <div
                  className="space-y-2"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <Input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveRename(theme.id);
                      if (e.key === "Escape") cancelRename();
                    }}
                    placeholder="Theme name"
                    className="font-semibold h-9"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => saveRename(theme.id)}>
                      Save
                    </Button>
                    <Button size="sm" variant="secondary" onClick={cancelRename}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="font-semibold truncate">{theme.name}</h3>
                  <p className="text-sm text-muted-foreground">Theme ID: {theme.theme_id}</p>
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1.5">Palette</p>
                    {theme.color_palette?.length ? (
                      <div className="flex flex-wrap items-center gap-2">
                        {theme.color_palette.map((hex, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/30 px-1.5 py-1"
                            title={hex}
                          >
                            <span
                              className="h-5 w-5 shrink-0 rounded border border-border/50"
                              style={{ backgroundColor: hex }}
                            />
                            <span className="text-xs font-mono text-muted-foreground">{hex}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No palette — retake screenshot to generate</p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Link>
          <CardFooter className="p-4 pt-0 flex flex-wrap gap-2">
            <Link href={`/theme/${theme.id}`} className="flex-1 min-w-0">
              <Button variant="secondary" size="sm" className="w-full gap-2">
                <ExternalLink className="h-4 w-4 shrink-0" />
                View & test
              </Button>
            </Link>
            {isAdmin && renamingId !== theme.id && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  title="Rename theme"
                  disabled={renamingId !== null}
                  onClick={(e) => startRename(e, theme)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  title="Retake screenshot"
                  disabled={retakingId === theme.id}
                  onClick={(e) => handleRetakeScreenshot(e, theme.id)}
                >
                  <Camera className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  title="Delete theme"
                  disabled={deletingId === theme.id}
                  onClick={(e) => handleDelete(e, theme.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
