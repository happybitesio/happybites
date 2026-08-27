import { Product, RestaurantSettings } from "@/types/menu"
import { isOutOfStockProduct, resolveProductRibbon, getProductSpiceLevel } from "@/utils/menuHelpers"
import withBasePath from "@/utils/basePath"
import { useTranslation } from "@/hooks/useTranslation"
import { cn } from "@/lib/utils"
import { ProductStatusRibbon } from "./ProductStatusRibbon"
import { ProductPrice } from "./ProductPrice"
import { ProductSpiceIndicator } from "./ProductSpiceIndicator"

interface Props {
  products: Product[]
  currentLanguage: string
  settings: RestaurantSettings
  onProductClick: (product: Product) => void
}

function bentoTileClass(index: number): { span: string; aspect: string } {
  const mod = index % 6
  if (mod === 0) return { span: "col-span-2 row-span-2", aspect: "aspect-square w-full" }
  if (mod === 3) return { span: "col-span-2 row-span-1", aspect: "aspect-[2/1] w-full" }
  return { span: "col-span-1 row-span-1", aspect: "aspect-square w-full" }
}

export function ProductBentoGrid({ products, currentLanguage, settings, onProductClick }: Props) {
  const { t } = useTranslation(currentLanguage)

  return (
    <div className="menu-bento-grid grid grid-cols-2 gap-2 pb-1 md:grid-cols-3 md:gap-2.5 lg:grid-cols-4">
      {products.map((product, index) => {
        const title = product.title[currentLanguage] || product.title.tr || ""
        const isFeatured = index % 6 === 0
        const tile = bentoTileClass(index)
        const outOfStock = isOutOfStockProduct(product.tags)
        const ribbon = resolveProductRibbon(product.tags)
        const spiceLevel = getProductSpiceLevel(product)

        return (
          <button
            key={product.id}
            type="button"
            onClick={() => onProductClick(product)}
            className={cn(
              "menu-bento-tile group relative overflow-hidden rounded-2xl bg-card text-left shadow-sm ring-1 ring-border/60 transition-transform active:scale-[0.98]",
              tile.span,
              tile.aspect,
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
            {ribbon ? (
              <ProductStatusRibbon label={t(ribbon.labelKey)} variant={ribbon.type} className="z-20" />
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
              <div className="mt-1 flex items-center justify-between gap-2">
                <ProductPrice
                  amount={parseFloat(product.price)}
                  currency={settings.default_currency || "TRY"}
                  language={currentLanguage}
                  size="sm"
                  className="text-white [&_span]:text-white"
                />
                <ProductSpiceIndicator level={spiceLevel} tone="overlay" />
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
