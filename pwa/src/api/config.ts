export interface HappyBitesRuntimeConfig {
  menuUrl: string;
  reviewUrl: string;
  restUrl: string;
  siteUrl: string;
  /** Absolute path prefix for static assets, e.g. /qrmenu */
  basePath?: string;
  logo?: string;
}

declare global {
  interface Window {
    HAPPYBITES_CONFIG?: HappyBitesRuntimeConfig;
  }
}

export function getMenuUrl(): string {
  return window.HAPPYBITES_CONFIG?.menuUrl ?? '/wp-json/happybites/v1/menu';
}

export function getReviewUrl(): string {
  return window.HAPPYBITES_CONFIG?.reviewUrl ?? '/wp-json/happybites/v1/review';
}

export function getRuntimeLogo(): string {
  return window.HAPPYBITES_CONFIG?.logo?.trim() ?? '';
}
