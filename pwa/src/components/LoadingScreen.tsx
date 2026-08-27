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
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#fafaf9] px-6 text-[#1c1917] dark:bg-[#0c0a09] dark:text-[#fafaf9]">
      <div className="w-full max-w-xs text-center">
        {logo ? (
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-black/5 shadow-sm ring-1 ring-black/10 dark:bg-white/10 dark:ring-white/15">
            <img
              src={withBasePath(logo)}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}

        <h2 className="flex items-center justify-center gap-2 text-lg font-semibold">
          <Loader2 className="h-5 w-5 shrink-0 animate-spin opacity-55" />
          <span>{loadingText}</span>
        </h2>
      </div>
    </div>
  )
}
