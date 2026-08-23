import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorScreenProps {
  error: string
  onRetry: () => void
  currentLanguage?: string
}

export const ErrorScreen = ({ error, onRetry, currentLanguage = "tr" }: ErrorScreenProps) => {
  const errorTitle =
    currentLanguage === "tr"
      ? "Menü yüklenemedi"
      : currentLanguage === "de"
        ? "Menü konnte nicht geladen werden"
        : currentLanguage === "ro"
          ? "Meniul nu a putut fi încărcat"
          : "Failed to load menu"

  const retryText =
    currentLanguage === "tr"
      ? "Tekrar dene"
      : currentLanguage === "de"
        ? "Erneut versuchen"
        : currentLanguage === "ro"
          ? "Încearcă din nou"
          : "Try again"

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
          <AlertCircle className="h-7 w-7 text-destructive" />
        </div>
        <h2 className="text-lg font-semibold">{errorTitle}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <Button onClick={onRetry} className="mt-6 w-full rounded-2xl">
          {retryText}
        </Button>
      </div>
    </div>
  )
}
