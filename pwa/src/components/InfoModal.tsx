import { useTranslation } from "../hooks/useTranslation"
import { RestaurantSettings } from "../types/menu"
import { MenuDialog } from "./MenuBottomSheet"

interface InfoModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  settings: RestaurantSettings
  currentLanguage: string
}

export function InfoModal({ isOpen, onOpenChange, settings, currentLanguage }: InfoModalProps) {
  const { t } = useTranslation(currentLanguage)
  const content = settings.information?.trim()

  if (!content) return null

  return (
    <MenuDialog open={isOpen} onOpenChange={onOpenChange} title={t("information.title")}>
      <div
        className="menu-info-content text-sm leading-relaxed text-muted-foreground"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </MenuDialog>
  )
}
