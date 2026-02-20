import { getDefaultThemeCustomCss } from "@/lib/store";
import { CustomizePageClient } from "@/components/customize-page-client";

const DEFAULT_THEME_ID = "223482";

export default async function CustomizePage() {
  const savedCss = await getDefaultThemeCustomCss();

  return (
    <CustomizePageClient
      themeId={DEFAULT_THEME_ID}
      initialCss={savedCss}
    />
  );
}
