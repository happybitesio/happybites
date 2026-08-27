import { createContext, useContext, type CSSProperties } from "react"

import type { ThemePalette } from "@/utils/theme"
import { blendHex, hexToRgba } from "@/utils/color"

export type MenuHeaderChromeTone = "media" | "media-light" | "theme"

const glassShell = "rounded-2xl border p-3 backdrop-blur-md"

interface MenuHeaderChromeContextValue {
  hasCover: boolean
  tone: MenuHeaderChromeTone
  palette: ThemePalette
  isDarkMode: boolean
}

export const MenuHeaderChromeContext = createContext<MenuHeaderChromeContextValue>({
  hasCover: false,
  tone: "theme",
  palette: {
    background: "#fafaf9",
    surface: "#ffffff",
    text: "#1c1917",
    text_muted: "#78716c",
    primary: "#ea580c",
    accent: "#0f766e",
    border: "#e7e5e4",
    header: "#ffffff",
  },
  isDarkMode: false,
})

export function useMenuHeaderChrome() {
  return useContext(MenuHeaderChromeContext)
}

export function getMenuHeaderChromeTone(hasCover: boolean, isDarkMode: boolean): MenuHeaderChromeTone {
  if (!hasCover) {
    return "theme"
  }

  return isDarkMode ? "media" : "media-light"
}

export function buildMenuHeaderChromeVars(
  palette: ThemePalette,
  isDarkMode: boolean,
  hasCover: boolean,
): CSSProperties | undefined {
  if (!hasCover || isDarkMode) {
    return undefined
  }

  const { background, primary, text } = palette

  return {
    "--hb-chrome-glass-bg": hexToRgba(blendHex(background, primary, 0.1), 0.28),
    "--hb-chrome-glass-border": hexToRgba(primary, 0.28),
    "--hb-chrome-pill-bg": hexToRgba(blendHex(background, primary, 0.16), 0.72),
    "--hb-chrome-pill-hover": hexToRgba(blendHex(background, primary, 0.24), 0.82),
    "--hb-chrome-pill-border": hexToRgba(primary, 0.22),
    "--hb-chrome-pill-text": text,
    "--hb-chrome-action-bg": hexToRgba(blendHex(background, primary, 0.2), 0.94),
    "--hb-chrome-action-hover": hexToRgba(blendHex(background, primary, 0.3), 0.98),
    "--hb-chrome-action-border": hexToRgba(primary, 0.26),
    "--hb-chrome-action-text": primary,
    "--hb-chrome-dock-bg": hexToRgba(blendHex(background, primary, 0.12), 0.35),
    "--hb-chrome-dock-border": hexToRgba(primary, 0.2),
    "--hb-chrome-badge-bg": hexToRgba(blendHex(background, primary, 0.16), 0.95),
    "--hb-chrome-badge-border": hexToRgba(primary, 0.22),
    "--hb-chrome-logo-ring-bg": hexToRgba(blendHex(background, primary, 0.1), 0.88),
    "--hb-chrome-logo-ring-border": hexToRgba(primary, 0.28),
  } as CSSProperties
}

export function buildMenuHeaderTopScrim(palette: ThemePalette, isDarkMode: boolean): string {
  if (isDarkMode) {
    return "linear-gradient(to bottom, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.18) 55%, transparent 100%)"
  }

  return `linear-gradient(to bottom, ${hexToRgba(palette.background, 0.92)} 0%, ${hexToRgba(palette.background, 0.45)} 55%, transparent 100%)`
}

export function getMenuHeaderStyles(tone: MenuHeaderChromeTone) {
  if (tone === "media-light") {
    return {
      title: "text-foreground drop-shadow-sm",
      subtitle: "text-muted-foreground",
      body: "text-foreground/90",
      moreButton: "text-primary hover:text-primary/80",
      badge: "hb-chrome-badge inline-flex items-center rounded-full px-3 py-1 text-xs font-medium backdrop-blur-md",
      logoRing: "hb-chrome-logo-ring rounded-full p-1 backdrop-blur-md",
      action: "hb-chrome-action h-9 w-9 rounded-full shadow-sm backdrop-blur-md",
      pill: "hb-chrome-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur-md transition-colors",
      social: "hb-chrome-social inline-flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition-colors",
      glass: `hb-chrome-glass ${glassShell}`,
      actionDock: "hb-chrome-dock rounded-full p-0.5 shadow-sm backdrop-blur-md",
    }
  }

  if (tone === "media") {
    return {
      title: "text-white drop-shadow-sm",
      subtitle: "text-white/85 drop-shadow-sm",
      body: "text-white/85",
      moreButton: "text-white/90 drop-shadow-sm hover:text-white",
      badge: "bg-white/18 text-white ring-1 ring-white/20 backdrop-blur-md",
      logoRing: "bg-white/12 ring-1 ring-white/25 backdrop-blur-md",
      action:
        "h-9 w-9 rounded-full border border-white/20 bg-black/45 text-white shadow-lg backdrop-blur-md hover:bg-black/60 hover:text-white",
      pill:
        "inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/16 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md transition-colors hover:bg-white/24",
      social:
        "inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/16 text-white backdrop-blur-md transition-colors hover:bg-white/24",
      glass: `${glassShell} border-white/18 bg-black/28 shadow-lg`,
      actionDock: "rounded-full border border-white/15 bg-black/35 p-0.5 shadow-lg backdrop-blur-md",
    }
  }

  return {
    title: "text-foreground",
    subtitle: "text-muted-foreground",
    body: "text-foreground/85",
    moreButton: "text-primary hover:text-primary/80",
    badge: "bg-primary/10 text-foreground ring-1 ring-primary/15 backdrop-blur-sm",
    logoRing: "bg-primary/10 ring-1 ring-primary/20 backdrop-blur-sm",
    action: "h-9 w-9 rounded-full text-primary hover:bg-primary/10 hover:text-primary",
    pill:
      "inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur-sm transition-colors hover:bg-primary/15",
    social:
      "inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary backdrop-blur-sm transition-colors hover:bg-primary/15",
    glass: `${glassShell} border-primary/15 bg-primary/10`,
    actionDock: "",
  }
}
