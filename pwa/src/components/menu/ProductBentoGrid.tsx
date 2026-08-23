import { Product, RestaurantSettings } from "@/types/menu"
import { formatPrice } from "@/utils/menuHelpers"
import withBasePath from "@/utils/basePath"
import { useTranslation } from "@/hooks/useTranslation"
import { cn } from "@/lib/utils"

interface Props {
  products: Product[]
  currentLanguage: string
  settings: RestaurantSettings
  onProductClick: (product: Product) => void
}

function bentoTileClass(index: number): string {
  const mod = index % 6
  if (mod === 0) return "col-span-2 row-span-2"
  if (mod === 3) return "col-span-2 row-span-1"
  return "col-span-1 row-span-1"
}

export function ProductBentoGrid({ products, currentLanguage, settings, onProductClick }: Props) {
  const { t } = useTranslation(currentLanguage)

  return (
    <div className="menu-bento-grid grid grid-cols-2 gap-2.5 px-4 pb-2 md:grid-cols-3 md:gap-3 md:px-6 lg:grid-cols-4">
      {products.map((product, index) => {
        const title = product.title[currentLanguage] || product.title.tr || ""
        const isFeatured = index % 6 === 0
        const isWide = index % 6 === 3
        const outOfStock = product.tags?.includes("out_of_stock")

        return (
          <button
            key={product.id}
            type="button"
            onClick={() => onProductClick(product)}
            className={cn(
              "menu-bento-tile group relative overflow-hidden rounded-2xl bg-card text-left shadow-sm ring-1 ring-border/60 transition-transform active:scale-[0.98]",
              bentoTileClass(index),
              isFeatured ? "min-h-[260px]" : isWide ? "min-h-[140px]" : "min-h-[140px]",
            )}
          >
            <img
              src={withBasePath(product.image?.url || "/placeholder.svg")}
              alt={product.image?.alt || title}
              className={cn(
                "absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105",
                outOfStock && "opacity-50 grayscale",
              )}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
            {outOfStock ? (
              <span className="absolute left-2 top-2 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-semibold text-white">
                {t("tags.out_of_stock")}
              </span>
            ) : null}
            <div className="absolute inset-x-0 bottom-0 p-3">
              <p
                className={cn(
                  "font-semibold leading-tight text-white",
                  isFeatured ? "text-base line-clamp-2" : "text-sm line-clamp-2",
                )}
              >
                {title}
              </p>
              <p className="mt-1 text-sm font-bold tabular-nums text-white/95">
                {formatPrice(parseFloat(product.price), settings.default_currency || "TRY", currentLanguage)}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
