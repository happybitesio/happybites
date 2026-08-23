import type { ThemeAppearance } from '@/types/menu'

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
