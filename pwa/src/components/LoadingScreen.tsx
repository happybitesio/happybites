import { Loader2 } from "lucide-react"
import { getRuntimeLogo } from "@/api/config"
import withBasePath from "@/utils/basePath"

interface LoadingScreenProps {
  currentLanguage?: string
}

export const LoadingScreen = ({ currentLanguage = "tr" }: LoadingScreenProps) => {
  const loadingText =
    currentLanguage === "tr"
      ? "Menü yükleniyor"
      : currentLanguage === "de"
        ? "Menü wird geladen"
        : "Loading menu"

  const logo = getRuntimeLogo()

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-6">
      <div className="w-full max-w-xs text-center">
        {logo ? (
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-muted shadow-sm ring-1 ring-border/50">
            <img
              src={withBasePath(logo)}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}

        <h2 className="flex items-center justify-center gap-2 text-lg font-semibold">
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" />
          <span>{loadingText}</span>
        </h2>
      </div>
    </div>
  )
}
