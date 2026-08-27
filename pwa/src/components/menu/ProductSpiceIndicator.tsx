import { SpiceLevel } from "@/components/SpiceLevel"
import { cn } from "@/lib/utils"

interface Props {
  level: number
  tone?: "default" | "overlay"
  className?: string
}

export function ProductSpiceIndicator({ level, tone = "default", className }: Props) {
  if (level <= 0) return null

  return (
    <SpiceLevel
      level={level}
      size="xs"
      tone={tone}
      className={cn("shrink-0", className)}
    />
  )
}
