import { notFound } from "next/navigation";
import Link from "next/link";
import { getThemeById } from "@/lib/store";
import { ThemeCustomizer } from "@/components/theme-customizer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function ThemeCustomizePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const theme = await getThemeById(id);
  if (!theme) notFound();
  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/theme/${id}`}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold">Customize: {theme.name}</h1>
      </div>
      <ThemeCustomizer theme={theme} />
    </div>
  );
}
