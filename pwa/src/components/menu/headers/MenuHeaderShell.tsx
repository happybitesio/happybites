import type { ReactNode } from "react"

import type { RestaurantSettings } from "@/types/menu"
import withBasePath from "@/utils/basePath"
import { buildHeaderOverlayGradient, getHeaderOverlayBaseColor } from "@/utils/browserChrome"
import { getPalette } from "@/utils/theme"
import { cn } from "@/lib/utils"

import {
  buildMenuHeaderChromeVars,
  buildMenuHeaderTopScrim,
  getMenuHeaderChromeTone,
  MenuHeaderChromeContext,
} from "./menuHeaderChrome"

interface Props {
  settings: RestaurantSettings
  isDarkMode: boolean
  children: ReactNode
  className?: string
  coverClassName?: string
}

export function MenuHeaderShell({ settings, isDarkMode, children, className, coverClassName }: Props) {
  const hasCover = Boolean(settings.header_background)
  const palette = getPalette(settings.theme, isDarkMode)
  const overlayColor = getHeaderOverlayBaseColor(palette.background, hasCover, isDarkMode)
  const overlayBackground = buildHeaderOverlayGradient(
    settings.appearance,
    isDarkMode,
    overlayColor,
    hasCover,
    palette.background,
  )
  const tone = getMenuHeaderChromeTone(hasCover, isDarkMode)
  const chromeVars = buildMenuHeaderChromeVars(palette, isDarkMode, hasCover)
  const topScrim = buildMenuHeaderTopScrim(palette, isDarkMode)

  return (
    <MenuHeaderChromeContext.Provider value={{ hasCover, tone, palette, isDarkMode }}>
      <header
        className={cn(
          "menu-header relative overflow-hidden",
          tone === "media-light" && "menu-header--light-media",
          className,
        )}
        style={chromeVars}
      >
        {hasCover ? (
          <div
            className={cn("menu-header__cover absolute inset-0 bg-cover bg-center", coverClassName)}
            style={{ backgroundImage: `url(${withBasePath(settings.header_background || "")})` }}
          />
        ) : (
          <div className={cn("menu-header__cover menu-header__cover--gradient absolute inset-0", coverClassName)} />
        )}

        {hasCover && isDarkMode ? (
          <div
            className="menu-header__overlay-top absolute inset-x-0 top-0 h-24"
            style={{ background: topScrim }}
          />
        ) : null}

        <div
          className="menu-header__overlay absolute inset-0"
          style={{ background: overlayBackground }}
        />

        {children}
      </header>
    </MenuHeaderChromeContext.Provider>
  )
}
