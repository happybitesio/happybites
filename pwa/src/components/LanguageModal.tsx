import { Button } from "@/components/ui/button"
import { capitalizeFirstLetter, getLanguageInfo } from "../utils/menuHelpers"
import { useTranslation } from "../hooks/useTranslation"
import { MenuDialog } from "./MenuBottomSheet"
import Flag from "@/utils/flags"
import { getSocialIcon } from "@/utils/socialMediaIcons"

interface LanguageModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  languages: string[]
  currentLanguage: string
  onSelect: (code: string) => void
}

export function LanguageModal({
  open,
  onOpenChange,
  languages,
  currentLanguage,
  onSelect,
}: LanguageModalProps) {
  const { t } = useTranslation(currentLanguage)

  return (
    <MenuDialog open={open} onOpenChange={onOpenChange} title={t("language.select")}>
      <div className="space-y-2">
        {languages.map((langCode) => {
          const lang = getLanguageInfo(langCode, langCode)
          const code = lang.code || "en"
          const name = lang.name || code.toUpperCase()
          const active = currentLanguage === code

          return (
            <Button
              key={code}
              variant={active ? "default" : "outline"}
              className="h-auto w-full justify-start py-4"
              onClick={() => onSelect(code)}
            >
              <Flag code={code} />
              <span className="flex-1 text-left">{name}</span>
              {active ? <span className="text-sm text-primary-foreground">✓</span> : null}
            </Button>
          )
        })}
      </div>
    </MenuDialog>
  )
}

interface SocialModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  socialMedia: Record<string, string>
  currentLanguage: string
}

export function SocialModal({
  open,
  onOpenChange,
  socialMedia,
  currentLanguage,
}: SocialModalProps) {
  const { t } = useTranslation(currentLanguage)

  return (
    <MenuDialog open={open} onOpenChange={onOpenChange} title={t("social.title")}>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {Object.entries(socialMedia)
          .filter(([, url]) => Boolean(url))
          .map(([platform, url]) => {
            const Icon = getSocialIcon(platform)

            return (
              <Button
                key={platform}
                variant="outline"
                className="h-auto w-full justify-start py-4"
                onClick={() => {
                  window.open(url, "_blank")
                  onOpenChange(false)
                }}
              >
                {Icon ? <Icon className="h-4 w-4 text-primary" /> : null}
                <span>{capitalizeFirstLetter(platform)}</span>
              </Button>
            )
          })}
      </div>
    </MenuDialog>
  )
}
