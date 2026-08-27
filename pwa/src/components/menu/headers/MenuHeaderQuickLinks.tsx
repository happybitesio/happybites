import { Star, Wifi, Info } from "lucide-react"

import { capitalizeFirstLetter } from "@/utils/menuHelpers"
import { getSocialIcon } from "@/utils/socialMediaIcons"

import { getMenuHeaderStyles, useMenuHeaderChrome } from "./menuHeaderChrome"
import { getGoogleBusinessUrl, getSocialLinks } from "./menuHeaderShared"
import type { MenuHeaderProps } from "./menuHeaderShared"

interface Props extends Pick<MenuHeaderProps, "settings" | "onWifiClick" | "onInfoClick"> {
  t: (key: string) => string
  align?: "start" | "center"
}

export function MenuHeaderQuickLinks({ settings, onWifiClick, onInfoClick, t, align = "start" }: Props) {
  const { tone } = useMenuHeaderChrome()
  const styles = getMenuHeaderStyles(tone)
  const hasInfo = Boolean(settings.information?.trim())
  const googleBusinessUrl = getGoogleBusinessUrl(settings.socialMedia)
  const GoogleIcon = getSocialIcon("googleBusiness")
  const socialLinks = getSocialLinks(settings)
  const alignmentClass = align === "center" ? "justify-center" : ""

  return (
    <div className="space-y-2">
      <div className={`flex flex-wrap items-center gap-2 ${alignmentClass}`}>
        <button type="button" onClick={onWifiClick} className={styles.pill}>
          <Wifi className="h-3.5 w-3.5" />
          {t("restaurant.wifi")}
        </button>

        {hasInfo ? (
          <button type="button" onClick={onInfoClick} className={styles.pill}>
            <Info className="h-3.5 w-3.5" />
            {t("information.shortLabel")}
          </button>
        ) : null}

        {googleBusinessUrl ? (
          <a href={googleBusinessUrl} target="_blank" rel="noopener noreferrer" className={styles.pill}>
            {GoogleIcon ? <GoogleIcon className="h-3.5 w-3.5" /> : null}
            <span>{t("restaurant.rateUs")}</span>
            <Star className="h-3 w-3 fill-yellow-300 text-yellow-300" />
          </a>
        ) : null}
      </div>

      {socialLinks.length > 0 ? (
        <div className={`flex flex-wrap items-center gap-2 ${alignmentClass}`}>
          {socialLinks.map(([platform, url]) => {
            const Icon = getSocialIcon(platform)
            if (!Icon) return null

            return (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={capitalizeFirstLetter(platform)}
                className={styles.social}
              >
                <Icon className="h-4 w-4" />
              </a>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
