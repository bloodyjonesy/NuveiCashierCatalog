export type ThemeRecord = {
  id: string;
  theme_id: string;
  name: string;
  screenshot_path: string | null;
};

export type CustomerRecord = {
  id: string;
  label: string;
  user_token_id: string;
};
