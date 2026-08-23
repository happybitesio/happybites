export interface ThemePalette {
  background: string
  surface: string
  text: string
  text_muted: string
  primary: string
  accent: string
  border: string
  header: string
}

export interface ThemeConfig {
  preset: string
  light: ThemePalette
  dark: ThemePalette
}

export const DEFAULT_LIGHT_PALETTE: ThemePalette = {
  background: '#fafaf9',
  surface: '#ffffff',
  text: '#1c1917',
  text_muted: '#78716c',
  primary: '#ea580c',
  accent: '#0f766e',
  border: '#e7e5e4',
  header: '#ffffff',
}

export const DEFAULT_DARK_PALETTE: ThemePalette = {
  background: '#0c0a09',
  surface: '#1c1917',
  text: '#fafaf9',
  text_muted: '#a8a29e',
  primary: '#f97316',
  accent: '#2dd4bf',
  border: '#292524',
  header: '#1c1917',
}

export const DEFAULT_THEME: ThemeConfig = {
  preset: 'verdant_brew',
  light: DEFAULT_LIGHT_PALETTE,
  dark: DEFAULT_DARK_PALETTE,
}

export function getPalette(theme: ThemeConfig | undefined, isDark: boolean): ThemePalette {
  if (!theme?.light || !theme?.dark) {
    return isDark ? DEFAULT_DARK_PALETTE : DEFAULT_LIGHT_PALETTE
  }

  return isDark ? theme.dark : theme.light
}

function contrastForeground(hex: string): string {
  const cleaned = hex.replace('#', '')
  if (cleaned.length !== 6) return '#ffffff'

  const r = parseInt(cleaned.slice(0, 2), 16)
  const g = parseInt(cleaned.slice(2, 4), 16)
  const b = parseInt(cleaned.slice(4, 6), 16)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000

  return yiq >= 140 ? '#111827' : '#ffffff'
}

function blendHex(from: string, to: string, ratio: number): string {
  const parse = (hex: string) => {
    const cleaned = hex.replace('#', '')
    if (cleaned.length !== 6) return [0, 0, 0]
    return [
      parseInt(cleaned.slice(0, 2), 16),
      parseInt(cleaned.slice(2, 4), 16),
      parseInt(cleaned.slice(4, 6), 16),
    ]
  }

  const [fr, fg, fb] = parse(from)
  const [tr, tg, tb] = parse(to)
  const mix = (a: number, b: number) => Math.round(a + (b - a) * ratio)
  const toHex = (value: number) => value.toString(16).padStart(2, '0')

  return `#${toHex(mix(fr, tr))}${toHex(mix(fg, tg))}${toHex(mix(fb, tb))}`
}

function mutedSurface(palette: ThemePalette): string {
  return blendHex(palette.background, palette.border, 0.45)
}

export function applyThemeVariables(palette: ThemePalette): void {
  const root = document.documentElement
  const primaryFg = contrastForeground(palette.primary)
  const mutedBg = mutedSurface(palette)

  root.style.setProperty('--hb-bg', palette.background)
  root.style.setProperty('--hb-surface', palette.surface)
  root.style.setProperty('--hb-text', palette.text)
  root.style.setProperty('--hb-text-muted', palette.text_muted)
  root.style.setProperty('--hb-primary', palette.primary)
  root.style.setProperty('--hb-accent', palette.accent)
  root.style.setProperty('--hb-border', palette.border)
  root.style.setProperty('--hb-header', palette.header)

  root.style.setProperty('--background', palette.background)
  root.style.setProperty('--foreground', palette.text)
  root.style.setProperty('--card', palette.surface)
  root.style.setProperty('--card-foreground', palette.text)
  root.style.setProperty('--popover', palette.surface)
  root.style.setProperty('--popover-foreground', palette.text)
  root.style.setProperty('--primary', palette.primary)
  root.style.setProperty('--primary-foreground', primaryFg)
  root.style.setProperty('--secondary', blendHex(palette.accent, palette.surface, 0.12))
  root.style.setProperty('--secondary-foreground', palette.text)
  root.style.setProperty('--muted', mutedBg)
  root.style.setProperty('--muted-foreground', palette.text_muted)
  root.style.setProperty('--accent', blendHex(palette.accent, palette.surface, 0.1))
  root.style.setProperty('--accent-foreground', palette.text)
  root.style.setProperty('--border', palette.border)
  root.style.setProperty('--input', palette.border)
  root.style.setProperty('--ring', palette.primary)
}

export function withResolvedColors<T extends { colors: { primary: string; secondary: string } }>(
  settings: T,
  palette: ThemePalette,
): T {
  return {
    ...settings,
    colors: {
      primary: palette.primary,
      secondary: palette.accent,
    },
  }
}
