export type ThemeRecord = {
  id: string;
  theme_id: string;
  name: string;
  screenshot_path: string | null;
  /** Base64 PNG for catalog thumbnail (persists on Railway where public/themes is ephemeral) */
  screenshot_base64?: string | null;
  /** Hex color palette extracted from screenshot on save (e.g. 5 colors) */
  color_palette?: string[] | null;
};

export type CustomerRecord = {
  id: string;
  label: string;
  user_token_id: string;
};
