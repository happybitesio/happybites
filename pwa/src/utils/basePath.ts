import type { HappyBitesRuntimeConfig } from '@/api/config';

declare global {
  interface Window {
    HAPPYBITES_CONFIG?: HappyBitesRuntimeConfig;
  }
}

function getRuntimeBasePath(): string {
  const configured = window.HAPPYBITES_CONFIG?.basePath?.trim();

  if (configured) {
    return configured.replace(/\/+$/, '');
  }

  return '';
}

export function withBasePath(path: string): string {
  if (!path) {
    return getRuntimeBasePath();
  }

  if (/^(https?:)?\/\//i.test(path) || path.startsWith('data:')) {
    return path;
  }

  const normalizedPath = path.replace(/^\/+/, '');
  const prefix = getRuntimeBasePath();

  if (prefix) {
    return `${prefix}/${normalizedPath}`;
  }

  // Vite dev / standalone: root-absolute paths from public/
  return `/${normalizedPath}`;
}

export default withBasePath;
