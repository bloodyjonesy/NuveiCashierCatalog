import { getDefaultThemeId, getThemeByThemeId } from "@/lib/store";
import { CustomizePageClient } from "@/components/customize-page-client";

export default async function CustomizePage() {
  const defaultThemeId = await getDefaultThemeId();
  const theme =
    defaultThemeId != null
      ? await getThemeByThemeId(defaultThemeId)
      : null;

  return (
    <CustomizePageClient
      defaultThemeId={defaultThemeId}
      theme={theme}
    />
  );
}
