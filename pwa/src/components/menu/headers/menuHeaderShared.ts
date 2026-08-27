import type { RestaurantSettings } from "@/types/menu"

export interface MenuHeaderProps {
  settings: RestaurantSettings
  isDarkMode: boolean
  currentLanguage: string
  onLanguageClick: () => void
  onDarkModeToggle: () => void
  onWifiClick: () => void
  onInfoClick: () => void
}

export function getGoogleBusinessUrl(socialMedia: Record<string, string> = {}): string {
  return (socialMedia.googleBusiness || socialMedia.google_business || "").trim()
}

export function isGoogleBusinessPlatform(platform: string): boolean {
  return platform.toLowerCase().replace(/_/g, "") === "googlebusiness"
}

export function getWorkingHours(workingHours: RestaurantSettings["workingHours"], t: (key: string) => string) {
  if (!workingHours) return "09:00 - 18:00"

  const today = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
  const todayData = workingHours[today]

  if (!todayData || !todayData.isOpen) return t("common.closed")

  return `${todayData.openTime} - ${todayData.closeTime}`
}

export function getSocialLinks(settings: RestaurantSettings) {
  return Object.entries(settings.socialMedia || {}).filter(
    ([platform, url]) => Boolean(url) && !isGoogleBusinessPlatform(platform),
  )
}
