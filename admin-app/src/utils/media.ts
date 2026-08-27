import { getConfig } from '../api/client';
import type { WpMediaFrame } from '../vite-env';

export function openMediaFrame(options?: {
  title?: string;
  button?: string;
  libraryType?: 'image' | 'video' | 'all';
}): WpMediaFrame | null {
  const config = getConfig();
  if (!window.wp?.media) {
    return null;
  }

  const args: {
    title: string;
    button: { text: string };
    multiple: boolean;
    library?: { type: string };
  } = {
    title: options?.title ?? config.media.title,
    button: { text: options?.button ?? config.media.button },
    multiple: false,
  };

  if (options?.libraryType && options.libraryType !== 'all') {
    args.library = { type: options.libraryType };
  }

  return window.wp.media(args);
}
