import { useState } from "react"
import { Check, Copy, Wifi } from "lucide-react"
import { useTranslation } from "../hooks/useTranslation"
import { RestaurantSettings } from "../types/menu"
import { MenuDialog } from "./MenuBottomSheet"
import { Button } from "./ui/button"

interface WiFiModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  settings: RestaurantSettings
  currentLanguage: string
}

export const WiFiModal = ({
  isOpen,
  onOpenChange,
  settings,
  currentLanguage,
}: WiFiModalProps) => {
  const { t } = useTranslation(currentLanguage)
  const [copied, setCopied] = useState(false)

  const copyPassword = async () => {
    const password = settings.wifi.password
    if (!password) return

    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement("textarea")
      textarea.value = password
      textarea.style.position = "fixed"
      textarea.style.opacity = "0"
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <MenuDialog open={isOpen} onOpenChange={onOpenChange} title={t("wifi.title")}>
      <div className="space-y-6">
        <div className="flex justify-center">
          <div className="rounded-2xl bg-muted p-5">
            <Wifi className="h-12 w-12 text-primary" />
          </div>
        </div>
        <div className="grid gap-3">
          <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3">
            <span className="font-medium">{t("wifi.ssid")}</span>
            <span className="font-semibold text-muted-foreground">{settings.wifi.ssid}</span>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl bg-muted px-4 py-3">
            <span className="shrink-0 font-medium">{t("wifi.password")}</span>
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate font-semibold text-muted-foreground">{settings.wifi.password}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 shrink-0 rounded-lg px-2.5"
                onClick={copyPassword}
                disabled={!settings.wifi.password}
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span className="sr-only">{copied ? t("wifi.copied") : t("wifi.copy")}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MenuDialog>
  )
}
