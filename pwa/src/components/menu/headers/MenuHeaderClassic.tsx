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

function MenuHeaderClassicContent({
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
  const { tone, hasCover } = useMenuHeaderChrome()
  const styles = getMenuHeaderStyles(tone)
  const isStackedBranding = hasCover

  const actions = (
    <MenuHeaderActions
      isDarkMode={isDarkMode}
      shareCopied={shareCopied}
      shareLabel={shareCopied ? t("restaurant.linkCopied") : t("restaurant.share")}
      onShare={onShare}
      onLanguageClick={onLanguageClick}
      onDarkModeToggle={onDarkModeToggle}
      className={cn(
        "flex shrink-0 items-center gap-0.5",
        isStackedBranding && "absolute right-4 top-[max(1rem,env(safe-area-inset-top))]",
      )}
    />
  )

  if (isStackedBranding) {
    return (
      <div className="relative z-10 px-4 pb-5 pt-[max(1rem,env(safe-area-inset-top))]">
        {actions}

        <div className="flex flex-col items-start pt-10">
          <div className={cn("mb-3 rounded-full p-1", styles.logoRing)}>
            <img
              src={withBasePath(settings.logo || "/placeholder.svg")}
              alt={settings.title}
              className="h-20 w-20 rounded-full object-cover"
            />
          </div>

          <h1 className={cn("text-lg font-bold tracking-tight", styles.title)}>{settings.title}</h1>

          <span className={cn("mt-1.5 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium", styles.badge)}>
            {getWorkingHours(settings.workingHours, t)}
          </span>
        </div>

        {settings.description ? (
          <ExpandableDescription text={settings.description} moreLabel={t("common.more")} className="mt-3" />
        ) : null}

        <MenuHeaderQuickLinks
          settings={settings}
          onWifiClick={onWifiClick}
          onInfoClick={onInfoClick}
          t={t}
        />
      </div>
    )
  }

  return (
    <div className="relative z-10 px-4 pb-5 pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={withBasePath(settings.logo || "/placeholder.svg")}
            alt={settings.title}
            className="h-11 w-11 shrink-0 rounded-2xl object-cover"
          />

          <div className="min-w-0">
            <h1 className={`truncate text-lg font-bold tracking-tight ${styles.title}`}>{settings.title}</h1>
            <p className={`truncate text-xs ${styles.subtitle}`}>{getWorkingHours(settings.workingHours, t)}</p>
          </div>
        </div>

        {actions}
      </div>

      {settings.description ? (
        <ExpandableDescription text={settings.description} moreLabel={t("common.more")} />
      ) : null}

      <MenuHeaderQuickLinks
        settings={settings}
        onWifiClick={onWifiClick}
        onInfoClick={onInfoClick}
        t={t}
      />
    </div>
  )
}

export function MenuHeaderClassic(props: MenuHeaderProps) {
  const { settings, isDarkMode, currentLanguage } = props
  const { t } = useTranslation(currentLanguage)
  const [shareCopied, setShareCopied] = useState(false)
  const hasCover = Boolean(settings.header_background)

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
      className={hasCover ? "menu-header--stacked" : undefined}
    >
      <MenuHeaderClassicContent {...props} shareCopied={shareCopied} onShare={handleShare} t={t} />
    </MenuHeaderShell>
  )
}
