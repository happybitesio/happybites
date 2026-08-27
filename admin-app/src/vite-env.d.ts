/// <reference types="vite/client" />

export interface HappyBitesAdminConfig {
  restUrl: string;
  nonce: string;
  adminUrl: string;
  page: 'dashboard' | 'menu' | 'settings' | 'reviews' | 'product-edit';
  pluginVersion: string;
  productId?: number;
  productAction?: 'new' | 'edit';
  categoryId?: number;
  returnUrl?: string;
  menuManageUrl?: string;
  settings: {
    default_currency: string;
    default_language: string;
    languages: string[];
  };
  media: {
    title: string;
    button: string;
  };
  locale?: string;
}

export interface WpMediaFrame {
  on: (event: string, callback: () => void) => void;
  open: () => void;
  state: () => { get: (key: string) => { first: () => { toJSON: () => { id: number; url: string } } } };
}

declare global {
  interface Window {
    HAPPYBITES_ADMIN_CONFIG?: HappyBitesAdminConfig;
    wp?: {
      editor?: {
        initialize: (id: string, settings: Record<string, unknown>) => void;
        remove: (id: string) => void;
      };
      media?: (args: { title: string; button: { text: string }; multiple: boolean }) => WpMediaFrame;
    };
    tinymce?: {
      get: (id: string) => {
        isHidden: () => boolean;
        getContent: () => string;
        on: (event: string, callback: () => void) => void;
      } | null;
    };
  }
}
