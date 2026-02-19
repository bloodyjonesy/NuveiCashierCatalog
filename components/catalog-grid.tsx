"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import type { ThemeRecord } from "@/lib/types";

export function CatalogGrid() {
  const [themes, setThemes] = useState<ThemeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/themes")
      .then((r) => r.json())
      .then((data) => {
        setThemes(Array.isArray(data) ? data : []);
      })
      .catch(() => setThemes([]))
      .finally(() => setLoading(false));
  }, []);

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
        <Link href="/add">
          <Button>Add your first theme</Button>
        </Link>
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
          <Link href={`/theme/${theme.id}`}>
            <div className="aspect-video bg-muted relative">
              {theme.screenshot_path ? (
                <img
                  src={theme.screenshot_path}
                  alt={theme.name}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                  No preview
                </div>
              )}
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold truncate">{theme.name}</h3>
              <p className="text-sm text-muted-foreground">Theme ID: {theme.theme_id}</p>
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <Button variant="secondary" size="sm" className="w-full gap-2">
                <ExternalLink className="h-4 w-4" />
                View & test
              </Button>
            </CardFooter>
          </Link>
        </Card>
      ))}
    </div>
  );
}
