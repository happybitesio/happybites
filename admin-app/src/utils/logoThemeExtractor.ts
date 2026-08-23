import { getColor, getPalette, getSwatches, type SwatchMap } from 'colorthief';
import type { ThemePalette } from '../api/client';

type Rgb = [number, number, number];

function clamp(value: number, min = 0, max = 255): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeHex(hex: string): string {
  const value = hex.trim().replace('#', '');
  if (value.length === 3) {
    return `#${value
      .split('')
      .map((char) => char + char)
      .join('')}`;
  }
  return `#${value.slice(0, 6)}`;
}

function hexToRgb(hex: string): Rgb {
  const value = normalizeHex(hex).replace('#', '');
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

function rgbToHex([r, g, b]: Rgb): string {
  return `#${[r, g, b]
    .map((channel) => clamp(Math.round(channel)).toString(16).padStart(2, '0'))
    .join('')}`;
}

function mixHex(base: string, target: string, amount: number): string {
  const ratio = Math.min(1, Math.max(0, amount));
  const [r1, g1, b1] = hexToRgb(base);
  const [r2, g2, b2] = hexToRgb(target);
  return rgbToHex([
    r1 + (r2 - r1) * ratio,
    g1 + (g2 - g1) * ratio,
    b1 + (b2 - b1) * ratio,
  ]);
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(foreground: string, background: string): number {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function ensureContrast(foreground: string, background: string, minRatio = 4.5): string {
  let color = foreground;
  let ratio = contrastRatio(color, background);
  let step = 0;

  while (ratio < minRatio && step < 24) {
    color =
      relativeLuminance(background) > 0.5
        ? mixHex(color, '#111827', 0.12)
        : mixHex(color, '#f8fafc', 0.12);
    ratio = contrastRatio(color, background);
    step += 1;
  }

  return color;
}

function swatchHex(swatches: SwatchMap, ...roles: Array<keyof SwatchMap>): string | null {
  for (const role of roles) {
    const hex = swatches[role]?.color.hex();
    if (hex) {
      return normalizeHex(hex);
    }
  }

  return null;
}

function mapSwatchesToTheme(swatches: SwatchMap, fallbackHex?: string | null): {
  light: ThemePalette;
  dark: ThemePalette;
  samples: string[];
} {
  const vibrant = swatchHex(swatches, 'Vibrant', 'DarkVibrant', 'LightVibrant') || fallbackHex || '#2563eb';
  const muted = swatchHex(swatches, 'Muted', 'LightMuted', 'DarkMuted') || vibrant;
  const lightMuted = swatchHex(swatches, 'LightMuted', 'LightVibrant') || muted;
  const darkMuted = swatchHex(swatches, 'DarkMuted', 'DarkVibrant') || vibrant;

  const lightBackground = mixHex(lightMuted, '#ffffff', 0.9);
  const lightSurface = '#ffffff';
  const lightText = ensureContrast(mixHex(vibrant, '#111827', 0.82), lightBackground);
  const lightTextMuted = ensureContrast(mixHex(muted, '#6b7280', 0.55), lightBackground, 3);

  const light: ThemePalette = {
    background: lightBackground,
    surface: lightSurface,
    text: lightText,
    text_muted: lightTextMuted,
    primary: vibrant,
    accent: muted,
    border: mixHex(vibrant, '#e5e7eb', 0.84),
    header: lightSurface,
  };

  const darkBackground = mixHex(darkMuted, '#09090b', 0.78);
  const darkSurface = mixHex(darkMuted, '#18181b', 0.55);
  const darkPrimary = swatchHex(swatches, 'LightVibrant', 'Vibrant') || mixHex(vibrant, '#ffffff', 0.28);
  const darkAccent = swatchHex(swatches, 'LightMuted', 'Muted') || mixHex(muted, '#ffffff', 0.22);
  const darkText = ensureContrast('#f8fafc', darkBackground);
  const darkTextMuted = ensureContrast(mixHex(muted, '#cbd5e1', 0.45), darkBackground, 3);

  const dark: ThemePalette = {
    background: darkBackground,
    surface: darkSurface,
    text: darkText,
    text_muted: darkTextMuted,
    primary: ensureContrast(darkPrimary, darkBackground, 3),
    accent: ensureContrast(darkAccent, darkBackground, 3),
    border: mixHex(darkMuted, '#3f3f46', 0.65),
    header: darkSurface,
  };

  const samples = [
    vibrant,
    muted,
    lightMuted,
    darkMuted,
    swatchHex(swatches, 'LightVibrant'),
    swatchHex(swatches, 'DarkVibrant'),
  ].filter((color): color is string => Boolean(color));

  return { light, dark, samples: [...new Set(samples)] };
}

export async function loadImageForColorExtraction(url: string): Promise<HTMLImageElement> {
  const tryLoad = (withCors: boolean) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      if (withCors) {
        image.crossOrigin = 'anonymous';
      }
      image.decoding = 'async';
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('image-load-failed'));
      image.src = url;
    });

  try {
    return await tryLoad(true);
  } catch {
    return tryLoad(false);
  }
}

export async function generateThemeFromLogoUrl(url: string): Promise<{
  light: ThemePalette;
  dark: ThemePalette;
  samples: string[];
}> {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    throw new Error('Logo URL bulunamadı.');
  }

  const image = await loadImageForColorExtraction(trimmedUrl);
  const [swatches, dominant, palette] = await Promise.all([
    getSwatches(image, { colorCount: 8 }),
    getColor(image),
    getPalette(image, { colorCount: 6 }),
  ]);

  const fallback = dominant?.hex() || palette?.[0]?.hex() || null;
  return mapSwatchesToTheme(swatches, fallback);
}
