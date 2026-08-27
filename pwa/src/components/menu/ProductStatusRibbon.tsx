import { cn } from "@/lib/utils"
import type { ProductRibbonType } from "@/utils/menuHelpers"

interface Props {
  label: string
  variant: ProductRibbonType
  size?: "sm" | "md"
  placement?: "corner" | "inline"
  className?: string
}

const variantClass: Record<ProductRibbonType, string> = {
  out_of_stock: "bg-destructive text-white ring-1 ring-destructive/30",
  popular: "bg-primary text-primary-foreground ring-1 ring-primary/20",
  new_product: "bg-emerald-600 text-white ring-1 ring-emerald-700/30 dark:bg-emerald-500",
}

export function ProductStatusRibbon({
  label,
  variant,
  size = "md",
  placement = "corner",
  className,
}: Props) {
  const isSmall = size === "sm"

  if (placement === "inline") {
    return (
      <span
        className={cn(
          "inline-flex max-w-full items-center rounded-full px-2 py-0.5 font-semibold leading-none",
          isSmall ? "text-[10px]" : "text-[11px]",
          variantClass[variant],
          className,
        )}
        aria-hidden
        title={label}
      >
        {label}
      </span>
    )
  }

  return (
    <span
      className={cn(
        "pointer-events-none absolute left-0 top-0 z-10 max-w-[min(52%,9.5rem)] truncate rounded-br-xl font-bold leading-none shadow-md",
        isSmall ? "px-2 py-1 text-[10px]" : "px-3 py-1.5 text-xs",
        variantClass[variant],
        className,
      )}
      aria-hidden
      title={label}
    >
      {label}
    </span>
  )
}
