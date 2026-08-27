import type { ThemeAppearance } from '@/types/menu'

import { blendHex, hexToRgba } from '@/utils/color'

export function syncBrowserChrome(
  appearance: ThemeAppearance | undefined,
  isDarkMode: boolean,
  backgroundColor?: string,
): void {
  if (backgroundColor) {
    document.documentElement.style.backgroundColor = backgroundColor
    document.body.style.backgroundColor = backgroundColor
  }

  if (!appearance?.theme_color) {
    return
  }

  const activeColor = isDarkMode ? appearance.theme_color.dark : appearance.theme_color.light
  const activeMeta = document.getElementById('hb-theme-color-active') as HTMLMetaElement | null

  if (activeMeta) {
    activeMeta.content = activeColor
  }
}

export function getHeaderOverlayOpacity(
  appearance: ThemeAppearance | undefined,
  isDarkMode: boolean,
): number {
  const fallback = isDarkMode ? 70 : 65
  const value = isDarkMode
    ? appearance?.header_overlay?.dark
    : appearance?.header_overlay?.light

  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback
  }

  return Math.max(0, Math.min(100, value))
}

export function getHeaderOverlayBaseColor(
  backgroundColor: string,
  hasCover: boolean,
  isDarkMode: boolean,
): string {
  if (!hasCover) {
    return backgroundColor
  }

  if (isDarkMode) {
    return blendHex(backgroundColor, '#000000', 0.35)
  }

  return backgroundColor
}

export function buildHeaderOverlayGradient(
  appearance: ThemeAppearance | undefined,
  isDarkMode: boolean,
  overlayColor: string,
  hasCover: boolean,
  backgroundColor?: string,
): string {
  const strength = getHeaderOverlayOpacity(appearance, isDarkMode) / 100
  const fadeBase = backgroundColor ?? overlayColor

  if (!hasCover) {
    const bottomAlpha = isDarkMode ? 0.95 : strength

    return `linear-gradient(to top, ${hexToRgba(fadeBase, bottomAlpha)} 0%, ${hexToRgba(overlayColor, strength * 0.45)} 40%, transparent 100%)`
  }

  if (isDarkMode) {
    const bottomAlpha = Math.min(1, 0.95 + strength * 0.05)

    return `linear-gradient(to top, ${hexToRgba(fadeBase, bottomAlpha)} 0%, ${hexToRgba(fadeBase, strength)} 18%, ${hexToRgba(fadeBase, strength * 0.92)} 35%, ${hexToRgba(fadeBase, strength * 0.78)} 52%, ${hexToRgba(fadeBase, strength * 0.58)} 68%, ${hexToRgba(fadeBase, strength * 0.35)} 82%, ${hexToRgba(fadeBase, strength * 0.12)} 94%, transparent 100%)`
  }

  return `linear-gradient(to top, ${hexToRgba(overlayColor, Math.min(1, strength * 1.05))} 0%, ${hexToRgba(overlayColor, strength * 0.88)} 24%, ${hexToRgba(overlayColor, strength * 0.62)} 48%, ${hexToRgba(overlayColor, strength * 0.34)} 68%, ${hexToRgba(overlayColor, strength * 0.12)} 84%, transparent 100%)`
}
