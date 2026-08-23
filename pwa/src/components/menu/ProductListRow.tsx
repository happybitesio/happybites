import { ChevronRight } from "lucide-react"
import { Product, RestaurantSettings } from "@/types/menu"
import { formatPrice } from "@/utils/menuHelpers"
import withBasePath from "@/utils/basePath"
import { useTranslation } from "@/hooks/useTranslation"
import { cn } from "@/lib/utils"

interface Props {
  product: Product
  currentLanguage: string
  settings: RestaurantSettings
  onClick: () => void
  className?: string
}

export function ProductListRow({ product, currentLanguage, settings, onClick, className }: Props) {
  const { t } = useTranslation(currentLanguage)
  const title = product.title[currentLanguage] || product.title.tr || ""
  const description = product.description[currentLanguage] || product.description.tr || ""
  const outOfStock = product.tags?.includes("out_of_stock")

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "menu-list-row group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-muted/60",
        className,
      )}
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
        <img
          src={withBasePath(product.image?.url || "/placeholder.svg")}
          alt={product.image?.alt || title}
          className={cn("h-full w-full object-cover", outOfStock && "opacity-50 grayscale")}
        />
        {outOfStock ? (
          <span className="absolute inset-x-0 bottom-0 bg-destructive/90 py-0.5 text-center text-[9px] font-semibold text-white">
            {t("tags.out_of_stock")}
          </span>
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3
            className={cn(
              "line-clamp-2 text-[15px] font-semibold leading-snug text-foreground",
              outOfStock && "opacity-60",
            )}
          >
            {title}
          </h3>
          <span className="shrink-0 text-[15px] font-bold tabular-nums text-primary">
            {formatPrice(parseFloat(product.price), settings.default_currency || "TRY", currentLanguage)}
          </span>
        </div>
        {description ? (
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-active:translate-x-0.5" />
    </button>
  )
}
