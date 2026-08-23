import { Globe, Share2, Sun, Moon, Clock, Wifi } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RestaurantSettings } from "../types/menu"
import { useTranslation } from "../hooks/useTranslation"
import withBasePath from "@/utils/basePath"

interface HeaderProps {
  settings: RestaurantSettings
  isDarkMode: boolean
  currentLanguage: string
  onLanguageClick: () => void
  onSocialClick: () => void
  onDarkModeToggle: () => void
  onWifiToggle: (isOpen: boolean) => void
}

const getWorkingHours = (workingHours: any, t: any) => {
  if (!workingHours) return "09:00 - 18:00"

  const today = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
  const todayData = workingHours[today]

  if (!todayData || !todayData.isOpen) {
    return t("common.closed")
  }

  return `${todayData.openTime} - ${todayData.closeTime}`
}

export const Header = ({
  settings,
  isDarkMode,
  currentLanguage,
  onLanguageClick,
  onSocialClick,
  onDarkModeToggle,
  onWifiToggle,
}: HeaderProps) => {
  const { t } = useTranslation(currentLanguage)

  return (
    <header className="relative overflow-hidden border-b bg-card shadow-sm">
      <div
        className="mx-auto bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${withBasePath(settings.header_background || "/placeholder.svg")})` }}
      >
        <div className="bg-card/85 backdrop-blur-sm">
          <div className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex-1" />
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={onLanguageClick} className="rounded-full">
                  <Globe className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onSocialClick} className="rounded-full">
                  <Share2 className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onDarkModeToggle} className="rounded-full">
                  {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3">
              <img
                src={withBasePath(settings.logo || "/placeholder.svg")}
                alt={settings.title}
                className="h-24 w-24 rounded-full border-4 border-background object-cover shadow-md"
              />
              <h1 className="text-center text-xl font-bold text-foreground">{settings.title}</h1>
            </div>

            {settings.description ? (
              <p className="mb-3 mt-2 text-center text-sm text-muted-foreground">{settings.description}</p>
            ) : null}

            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{getWorkingHours(settings.workingHours, t)}</span>
              </div>
              <button
                type="button"
                onClick={() => onWifiToggle(true)}
                className="flex items-center gap-1 text-primary underline-offset-4 hover:underline"
              >
                <Wifi className="h-4 w-4" />
                <span>{t("wifi.title")}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
