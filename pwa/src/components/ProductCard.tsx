import { ProductTagBadge } from "./menu/ProductTagBadge"
import { Card, CardContent } from "@/components/ui/card"
import { getInlineProductTags, getProductSpiceLevel, isOutOfStockProduct, resolveProductRibbon } from "@/utils/menuHelpers"
import withBasePath from "@/utils/basePath"
import { Product, RestaurantSettings } from "../types/menu"
import { useTranslation } from "../hooks/useTranslation"
import { ProductSpiceIndicator } from "./menu/ProductSpiceIndicator"
import { ProductStatusRibbon } from "./menu/ProductStatusRibbon"
import { ProductPrice } from "./menu/ProductPrice"
import { cn } from "@/lib/utils"

interface ProductCardProps {
  product: Product
  currentLanguage: string
  settings: RestaurantSettings
  onClick: () => void
}

export const ProductCard = ({ product, currentLanguage, settings, onClick }: ProductCardProps) => {
  const { t } = useTranslation(currentLanguage)
  const outOfStock = isOutOfStockProduct(product.tags)
  const ribbon = resolveProductRibbon(product.tags)
  const displayTags = getInlineProductTags(product.tags, 3)
  const spiceLevel = getProductSpiceLevel(product)

  return (
    <Card
      className="cursor-pointer rounded-none border-0 border-b bg-card shadow-none transition-colors last:border-b-0 hover:bg-muted/40"
      onClick={onClick}
    >
      <CardContent className="relative overflow-hidden p-0">
        {ribbon ? <ProductStatusRibbon label={t(ribbon.labelKey)} variant={ribbon.type} /> : null}

        <div className="flex gap-3 p-3">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
            <img
              src={withBasePath(product.image?.url || "/placeholder.svg")}
              alt={product.title[currentLanguage] || product.title.tr || ""}
              className={cn("aspect-square h-full w-full object-cover", outOfStock && "opacity-50 grayscale")}
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-between">
            <div className="mb-1 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="mb-1 flex items-start gap-1.5">
                  <h4
                    className="line-clamp-2 text-base font-semibold leading-tight text-foreground"
                    style={{ opacity: outOfStock ? 0.6 : 1 }}
                  >
                    {product.title[currentLanguage] || product.title.tr || ""}
                  </h4>
                  <ProductSpiceIndicator level={spiceLevel} className="mt-0.5" />
                </div>
                <p className="line-clamp-2 text-xs leading-tight text-muted-foreground">
                  {product.description[currentLanguage] || product.description.tr || ""}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <ProductPrice
                  amount={parseFloat(product.price)}
                  currency={settings.default_currency || "TRY"}
                  language={currentLanguage}
                  size="sm"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {displayTags.map((tag) => (
                <ProductTagBadge key={tag} tag={tag} label={t(`tags.${tag}`)} />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
