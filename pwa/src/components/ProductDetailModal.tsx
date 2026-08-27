import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Clock, Globe, Users } from "lucide-react"
import { useTranslation } from "../hooks/useTranslation"
import { Product, RestaurantSettings } from "../types/menu"
import { formatProductPortion, formatProductWeight, getProductSpiceLevel } from "@/utils/menuHelpers"
import withBasePath from "@/utils/basePath"
import { MenuBottomSheet } from "./MenuBottomSheet"
import { ProductTagBadge } from "./menu/ProductTagBadge"
import { ProductPrice } from "./menu/ProductPrice"
import { SpiceLevel } from "./SpiceLevel"
import { cn } from "@/lib/utils"

interface ProductDetailModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  currentLanguage: string
  settings: RestaurantSettings
}

export const ProductDetailModal = ({
  isOpen,
  onOpenChange,
  product,
  currentLanguage,
  settings,
}: ProductDetailModalProps) => {
  const { t } = useTranslation(currentLanguage)

  if (!product) return null

  const title = product.title[currentLanguage] || product.title.tr || ""
  const description = product.description[currentLanguage] || product.description.tr || ""
  const outOfStock = product.tags?.includes("out_of_stock")
  const price = parseFloat(product.price)

  const metaItems = [
    product.weight
      ? { key: "weight", label: formatProductWeight(product.weight, t("menu.weight"))! }
      : null,
    product.portion_size
      ? { key: "portion", label: formatProductPortion(product.portion_size, t("menu.portion"))!, icon: Users }
      : null,
    product.preparation_time
      ? { key: "time", label: `${product.preparation_time} ${t("menu.minutes")}`, icon: Clock }
      : null,
    product.spice_level && parseInt(product.spice_level) > 0
      ? {
          key: "spice",
          label: `${t("menu.spiceLevel")} ${getProductSpiceLevel(product)}/3`,
          spiceLevel: getProductSpiceLevel(product),
        }
      : null,
    product.origin_country && product.origin_country.trim() !== ""
      ? {
          key: "origin",
          label: `${t("menu.origin")}: ${product.origin_country.trim()}`,
          icon: Globe,
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string
    label: string
    icon?: typeof Clock
    spiceLevel?: number
  }>

  const formatNutritionValue = (value: string) => {
    if (value.includes("kcal") || value.includes("cal")) return value
    if (value.includes("g") || value.includes("mg")) return value
    if (!isNaN(Number(value))) return `${value}g`
    return value
  }

  const hasIngredients =
    product.ingredients &&
    Object.values(product.ingredients).some((items) => Array.isArray(items) && items.length > 0)

  const hasAllergens =
    product.allergens &&
    Object.values(product.allergens).some((items) => Array.isArray(items) && items.length > 0)

  const hasAdditives = Boolean(product.additives && product.additives.length > 0)

  return (
    <MenuBottomSheet
      open={isOpen}
      onOpenChange={onOpenChange}
      title={title}
      tall
      flushMedia={
        <div className="relative bg-muted">
          {outOfStock ? (
            <span className="absolute left-3 top-3 z-10 rounded-full bg-destructive px-3 py-1 text-xs font-semibold text-white">
              {t("tags.out_of_stock")}
            </span>
          ) : null}
          <img
            src={withBasePath(product.image?.url || "/placeholder.svg")}
            alt={product.image?.alt || title}
            className={cn("block h-auto w-full max-w-full", outOfStock && "opacity-70 grayscale")}
          />
        </div>
      }
    >
      <div className="space-y-0 pb-4">
        <div className="flex items-baseline justify-between gap-4 border-b border-border/60 py-4">
          <ProductPrice
            amount={price}
            currency={settings.default_currency || "TRY"}
            language={currentLanguage}
            size="lg"
          />
        </div>

        {metaItems.length > 0 ? (
          <div className="flex flex-wrap gap-2 border-b border-border/60 py-4">
            {metaItems.map((item) => {
              const Icon = item.icon
              return (
                <span
                  key={item.key}
                  className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground"
                >
                  {item.spiceLevel ? (
                    <SpiceLevel level={item.spiceLevel} size="sm" />
                  ) : Icon ? (
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                  ) : null}
                  {item.label}
                </span>
              )
            })}
          </div>
        ) : null}

        {description ? (
          <p className="border-b border-border/60 py-4 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}

        {product.tags && product.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2 border-b border-border/60 py-4">
            {product.tags.map((tag) => (
              <ProductTagBadge key={tag} tag={tag} label={t(`tags.${tag}`)} variant="detail" />
            ))}
          </div>
        ) : null}

        <Accordion type="multiple" className="w-full">
          {hasIngredients ? (
            <AccordionItem value="ingredients" className="border-b border-border/60">
              <AccordionTrigger className="py-4 text-sm font-semibold hover:no-underline">
                {t("menu.ingredients")}
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="space-y-2">
                  {Object.entries(product.ingredients!).flatMap(([lang, ingredients]) => {
                    if (lang !== currentLanguage || !Array.isArray(ingredients)) return []
                    return ingredients.map((ingredient, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between gap-3 border-b border-border/40 py-2 last:border-0"
                      >
                        <span className="text-sm font-medium">{ingredient.name}</span>
                        <span className="shrink-0 text-sm text-muted-foreground">{ingredient.amount}</span>
                      </div>
                    ))
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ) : null}

          {product.nutrition && product.nutrition.length > 0 ? (
            <AccordionItem value="nutrition" className="border-b border-border/60">
              <AccordionTrigger className="py-4 text-sm font-semibold hover:no-underline">
                {t("menu.nutritionFacts")}
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="space-y-2">
                  {product.nutrition.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-3 border-b border-border/40 py-2 last:border-0"
                    >
                      <span className="text-sm font-medium">{item.name}</span>
                      <span className="text-sm text-muted-foreground">{formatNutritionValue(item.value)}</span>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ) : null}

          {hasAllergens ? (
            <AccordionItem value="allergens" className="border-b border-border/60">
              <AccordionTrigger className="py-4 text-sm font-semibold hover:no-underline">
                {t("menu.allergens")}
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                {Object.entries(product.allergens!).map(([lang, allergens]) => {
                  if (lang !== currentLanguage || !Array.isArray(allergens)) return null
                  return (
                    <div key={lang} className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {allergens.map((allergen, index) => (
                          <span
                            key={index}
                            className="rounded-full border border-destructive/20 bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive dark:border-destructive/35 dark:bg-destructive/20"
                          >
                            {allergen}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </AccordionContent>
            </AccordionItem>
          ) : null}

          {hasAdditives ? (
            <AccordionItem value="additives" className="border-b border-border/60">
              <AccordionTrigger className="py-4 text-sm font-semibold hover:no-underline">
                {t("menu.additives")}
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="flex flex-wrap gap-2">
                  {product.additives!.map((additive, index) => (
                    <span
                      key={index}
                      className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground"
                    >
                      {additive}
                    </span>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ) : null}
        </Accordion>
      </div>
    </MenuBottomSheet>
  )
}
