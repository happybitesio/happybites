import { getConfig } from '../api/client';

interface WpMediaFrame {
  on: (event: string, callback: () => void) => void;
  open: () => void;
  state: () => { get: (key: string) => { first: () => { toJSON: () => { id: number; url: string } } } };
}

declare global {
  interface Window {
    wp?: {
      media: (args: { title: string; button: { text: string }; multiple: boolean }) => WpMediaFrame;
    };
  }
}

export function openMediaFrame(): WpMediaFrame | null {
  const config = getConfig();
  if (!window.wp?.media) {
    return null;
  }

  return window.wp.media({
    title: config.media.title,
    button: { text: config.media.button },
    multiple: false,
  });
}
