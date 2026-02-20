import { notFound } from "next/navigation";
import Link from "next/link";
import { getThemeById } from "@/lib/store";
import { ThemeTestView } from "@/components/theme-test-view";
import { Button } from "@/components/ui/button";
import { Palette } from "lucide-react";

export default async function ThemeTestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const theme = await getThemeById(id);
  if (!theme) notFound();
  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2">{theme.name}</h1>
          <p className="text-muted-foreground text-sm">Theme ID: {theme.theme_id}</p>
        </div>
        <Link href={`/theme/${id}/customize`}>
          <Button variant="outline" size="sm" className="gap-2">
            <Palette className="h-4 w-4" />
            Customize
          </Button>
        </Link>
      </div>
      <ThemeTestView theme={theme} />
    </div>
  );
}
