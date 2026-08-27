import { ChiliIcon } from "@/components/icons/ChiliIcon"
import { cn } from "@/lib/utils"

interface SpiceLevelProps {
  level: string | number
  tone?: "default" | "overlay"
  size?: "xs" | "sm" | "md" | "lg"
  className?: string
}

export const SpiceLevel = ({ level, tone = "default", size = "md", className }: SpiceLevelProps) => {
  const numLevel = typeof level === "string" ? parseInt(level, 10) : level
  const sizeClasses = {
    xs: "h-3 w-3",
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }

  return (
    <div className={cn("flex items-center gap-px", className)} aria-hidden>
      {[...Array(3)].map((_, i) => (
        <ChiliIcon
          key={i}
          active={i < numLevel}
          tone={tone}
          className={sizeClasses[size]}
        />
      ))}
    </div>
  )
}
