import { useState } from "react"

import { ExpandableDescription } from "@/components/menu/ExpandableDescription"
import { useTranslation } from "@/hooks/useTranslation"
import { cn } from "@/lib/utils"
import withBasePath from "@/utils/basePath"
import { shareMenuPage } from "@/utils/shareMenu"

import { MenuHeaderActions } from "./MenuHeaderActions"
import { getMenuHeaderStyles, useMenuHeaderChrome } from "./menuHeaderChrome"
import { MenuHeaderQuickLinks } from "./MenuHeaderQuickLinks"
import { MenuHeaderShell } from "./MenuHeaderShell"
import { getWorkingHours, type MenuHeaderProps } from "./menuHeaderShared"

type ContentProps = MenuHeaderProps & {
  shareCopied: boolean
  onShare: () => void
  t: (key: string) => string
}

function MenuHeaderCenteredContent({
  settings,
  isDarkMode,
  onLanguageClick,
  onDarkModeToggle,
  onWifiClick,
  onInfoClick,
  shareCopied,
  onShare,
  t,
}: ContentProps) {
  const { tone } = useMenuHeaderChrome()
  const styles = getMenuHeaderStyles(tone)

  return (
    <div className="relative z-10 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <MenuHeaderActions
        isDarkMode={isDarkMode}
        shareCopied={shareCopied}
        shareLabel={shareCopied ? t("restaurant.linkCopied") : t("restaurant.share")}
        onShare={onShare}
        onLanguageClick={onLanguageClick}
        onDarkModeToggle={onDarkModeToggle}
        className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] flex items-center gap-0.5"
      />

      <div className="flex flex-col items-center pt-10 text-center">
        <div className={cn("mb-4 rounded-full p-1", styles.logoRing)}>
          <img
            src={withBasePath(settings.logo || "/placeholder.svg")}
            alt={settings.title}
            className="h-20 w-20 rounded-full object-cover"
          />
        </div>

        <h1 className={cn("max-w-[18rem] text-xl font-bold tracking-tight", styles.title)}>{settings.title}</h1>

        <span className={cn("mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium", styles.badge)}>
          {getWorkingHours(settings.workingHours, t)}
        </span>

        {settings.description ? (
          <ExpandableDescription
            text={settings.description}
            moreLabel={t("common.more")}
            className="mt-4 flex w-full max-w-sm flex-col items-center text-center [&>button]:block"
          />
        ) : null}
      </div>

      <div className={cn("mt-4", styles.glass)}>
        <MenuHeaderQuickLinks
          settings={settings}
          onWifiClick={onWifiClick}
          onInfoClick={onInfoClick}
          t={t}
          align="center"
        />
      </div>
    </div>
  )
}

export function MenuHeaderCentered(props: MenuHeaderProps) {
  const { settings, isDarkMode, currentLanguage } = props
  const { t } = useTranslation(currentLanguage)
  const [shareCopied, setShareCopied] = useState(false)

  const handleShare = async () => {
    const result = await shareMenuPage(settings.title, settings.description)

    if (result === "copied") {
      setShareCopied(true)
      window.setTimeout(() => setShareCopied(false), 2000)
    }
  }

  return (
    <MenuHeaderShell
      settings={settings}
      isDarkMode={isDarkMode}
      className="menu-header--centered"
      coverClassName="menu-header__cover--centered"
    >
      <MenuHeaderCenteredContent {...props} shareCopied={shareCopied} onShare={handleShare} t={t} />
    </MenuHeaderShell>
  )
}
