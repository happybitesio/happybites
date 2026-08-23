import { Globe, Info, Moon, Share2, Sun, Wifi } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RestaurantSettings } from "@/types/menu"
import { useTranslation } from "@/hooks/useTranslation"
import withBasePath from "@/utils/basePath"
import { getHeaderOverlayOpacity } from "@/utils/browserChrome"

interface Props {
  settings: RestaurantSettings
  isDarkMode: boolean
  currentLanguage: string
  onLanguageClick: () => void
  onSocialClick: () => void
  onDarkModeToggle: () => void
  onWifiClick: () => void
  onInfoClick: () => void
}

function getWorkingHours(workingHours: any, t: (key: string) => string) {
  if (!workingHours) return "09:00 - 18:00"
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
  const todayData = workingHours[today]
  if (!todayData || !todayData.isOpen) return t("common.closed")
  return `${todayData.openTime} - ${todayData.closeTime}`
}

export function MenuHeader({
  settings,
  isDarkMode,
  currentLanguage,
  onLanguageClick,
  onSocialClick,
  onDarkModeToggle,
  onWifiClick,
  onInfoClick,
}: Props) {
  const { t } = useTranslation(currentLanguage)
  const hasCover = Boolean(settings.header_background)
  const hasInfo = Boolean(settings.information?.trim())
  const overlayOpacity = getHeaderOverlayOpacity(settings.appearance, isDarkMode) / 100

  return (
    <header className="menu-header relative overflow-hidden">
      {hasCover ? (
        <div
          className="menu-header__cover absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${withBasePath(settings.header_background || "")})` }}
        />
      ) : (
        <div className="menu-header__cover menu-header__cover--gradient absolute inset-0" />
      )}
      <div
        className="menu-header__overlay absolute inset-0"
        style={{
          ["--hb-overlay-top" as string]: overlayOpacity,
          ["--hb-overlay-mid" as string]: overlayOpacity * 0.55,
          ["--hb-overlay-bottom" as string]: overlayOpacity * 0.85,
        }}
      />

      <div className="relative z-10 px-4 pb-5 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src={withBasePath(settings.logo || "/placeholder.svg")}
              alt={settings.title}
              className="h-11 w-11 shrink-0 rounded-2xl border-2 border-white/20 object-cover shadow-lg"
            />
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold tracking-tight text-white">{settings.title}</h1>
              <p className="truncate text-xs text-white/75">{getWorkingHours(settings.workingHours, t)}</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={onLanguageClick}
              className="h-9 w-9 rounded-full text-white hover:bg-white/15 hover:text-white"
            >
              <Globe className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onSocialClick}
              className="h-9 w-9 rounded-full text-white hover:bg-white/15 hover:text-white"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDarkModeToggle}
              className="h-9 w-9 rounded-full text-white hover:bg-white/15 hover:text-white"
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {settings.description ? (
          <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-white/85">{settings.description}</p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onWifiClick}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/25"
          >
            <Wifi className="h-3.5 w-3.5" />
            {t("restaurant.wifi")}
          </button>
          {hasInfo ? (
            <button
              type="button"
              onClick={onInfoClick}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/25"
            >
              <Info className="h-3.5 w-3.5" />
              {t("information.shortLabel")}
            </button>
          ) : null}
        </div>
      </div>
    </header>
  )
}
