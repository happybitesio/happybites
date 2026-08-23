import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { formatPrice } from "@/utils/menuHelpers"
import withBasePath from "@/utils/basePath"
import { Product, RestaurantSettings } from "../types/menu"
import { useTranslation } from "../hooks/useTranslation"
import { SpiceLevel } from "./SpiceLevel"

interface ProductCardProps {
  product: Product
  currentLanguage: string
  settings: RestaurantSettings
  onClick: () => void
}

export const ProductCard = ({ product, currentLanguage, settings, onClick }: ProductCardProps) => {
  const { t } = useTranslation(currentLanguage)
  const outOfStock = product.tags?.includes("out_of_stock")

  return (
    <Card
      className="cursor-pointer rounded-none border-0 border-b bg-card shadow-none transition-colors last:border-b-0 hover:bg-muted/40"
      onClick={onClick}
    >
      <CardContent className="relative p-0">
        {outOfStock ? (
          <div className="absolute left-8 top-8 z-10 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-destructive px-10 py-0.5 text-xs text-white">
            {t("tags.out_of_stock")}
          </div>
        ) : null}

        <div className="flex gap-3 p-3">
          <div className="relative h-20 w-20 shrink-0">
            <img
              src={withBasePath(product.image?.url || "/placeholder.svg")}
              alt={product.title[currentLanguage] || product.title.tr || ""}
              className="aspect-square h-full w-full rounded-xl object-cover"
              style={{ opacity: outOfStock ? 0.5 : 1 }}
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-between">
            <div className="mb-1 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h4
                  className="mb-1 line-clamp-2 text-base font-semibold leading-tight text-foreground"
                  style={{ opacity: outOfStock ? 0.6 : 1 }}
                >
                  {product.title[currentLanguage] || product.title.tr || ""}
                </h4>
                <p className="line-clamp-2 text-xs leading-tight text-muted-foreground">
                  {product.description[currentLanguage] || product.description.tr || ""}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <span className="text-base font-bold text-secondary">
                  {formatPrice(parseFloat(product.price), settings.default_currency || "TRY", currentLanguage)}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {product.spice_level && parseInt(product.spice_level) > 0 ? (
                <SpiceLevel level={parseInt(product.spice_level)} />
              ) : null}
              {product.tags?.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px]">
                  {t(`tags.${tag}`)}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
