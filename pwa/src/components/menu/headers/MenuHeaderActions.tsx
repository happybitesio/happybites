import { Button } from "@/components/ui/button"
import { Languages, Moon, Share2, Sun } from "lucide-react"

import { getMenuHeaderStyles, useMenuHeaderChrome } from "./menuHeaderChrome"
import { cn } from "@/lib/utils"

interface Props {
  isDarkMode: boolean
  shareCopied: boolean
  shareLabel: string
  onShare: () => void
  onLanguageClick: () => void
  onDarkModeToggle: () => void
  className?: string
}

export function MenuHeaderActions({
  isDarkMode,
  shareCopied,
  shareLabel,
  onShare,
  onLanguageClick,
  onDarkModeToggle,
  className,
}: Props) {
  const { tone } = useMenuHeaderChrome()
  const styles = getMenuHeaderStyles(tone)

  return (
    <div className={cn(className, (tone === "media" || tone === "media-light") && styles.actionDock)}>
      <Button
        variant="ghost"
        size="icon"
        onClick={onShare}
        aria-label={shareLabel}
        className={styles.action}
      >
        <Share2 className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onLanguageClick}
        className={styles.action}
      >
        <Languages className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onDarkModeToggle}
        className={styles.action}
      >
        {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
    </div>
  )
}
