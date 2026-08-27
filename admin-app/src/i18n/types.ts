export type Messages = {
  common: Record<string, string>;
  days: Record<string, string>;
  languages: Record<string, string>;
  dashboard: Record<string, string>;
  menu: Record<string, string>;
  settings: {
    title: string;
    description: string;
    loading: string;
    saveSuccess: string;
    saveFailed: string;
    saveBarHint: string;
    saveBtn: string;
    tabs: Record<string, string>;
    general: Record<string, string>;
    languages: Record<string, string>;
    hours: Record<string, string>;
    social: Record<string, string>;
    advanced: Record<string, string>;
    security: Record<string, string>;
  };
  reviews: Record<string, string>;
  /** Present only in locales that still carry legacy Pro strings. */
  stories?: Record<string, string>;
  menuDisplay?: Record<string, unknown>;
  pro: Record<string, string>;
  license: Record<string, string>;
  mcp: Record<string, string>;
  theme: Record<string, unknown>;
  qr: Record<string, string>;
  imageField: Record<string, string>;
  categoryModal: Record<string, string>;
  productModal: Record<string, unknown>;
  spiceLevels: Record<string, string>;
};
