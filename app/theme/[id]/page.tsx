import { notFound } from "next/navigation";
import { getThemeById } from "@/lib/store";
import { ThemeTestView } from "@/components/theme-test-view";

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
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">{theme.name}</h1>
        <p className="text-muted-foreground text-sm">
          Theme ID: {theme.theme_id}
          <span className="ml-2 inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {theme.device_type === "mobile" ? "Mobile" : "Desktop"} theme
          </span>
        </p>
      </div>
      <ThemeTestView theme={theme} />
    </div>
  );
}
