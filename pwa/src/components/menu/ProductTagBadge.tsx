import { cn } from "@/lib/utils"
import { getProductTagIcon, productTagBadgeClass } from "@/utils/productTags"

interface Props {
  tag: string
  label: string
  variant?: "pill" | "detail"
  className?: string
}

export function ProductTagBadge({ tag, label, variant = "pill", className }: Props) {
  const icon = getProductTagIcon(tag)

  if (variant === "detail") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1 text-xs font-medium text-foreground",
          className,
        )}
      >
        {icon ? (
          <span className="text-sm leading-none" aria-hidden>
            {icon}
          </span>
        ) : null}
        {label}
      </span>
    )
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        productTagBadgeClass(tag),
        className,
      )}
    >
      {icon ? (
        <span className="text-[12px] leading-none" aria-hidden>
          {icon}
        </span>
      ) : null}
      {label}
    </span>
  )
}
