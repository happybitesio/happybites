import { ChevronRight } from "lucide-react"
import { Product, RestaurantSettings } from "@/types/menu"
import { formatProductMetaSummary, getInlineProductTags, getProductSpiceLevel, isOutOfStockProduct, resolveProductRibbon } from "@/utils/menuHelpers"
import withBasePath from "@/utils/basePath"
import { useTranslation } from "@/hooks/useTranslation"
import { cn } from "@/lib/utils"
import { ProductStatusRibbon } from "./ProductStatusRibbon"
import { ProductTagBadge } from "./ProductTagBadge"
import { ProductPrice } from "./ProductPrice"
import { ProductSpiceIndicator } from "./ProductSpiceIndicator"

type ListStyle = NonNullable<RestaurantSettings["listStyle"]>

interface Props {
  product: Product
  currentLanguage: string
  settings: RestaurantSettings
  onClick: () => void
  listStyle?: ListStyle
  className?: string
}

function ProductListCard({
  product,
  currentLanguage,
  settings,
  onClick,
  className,
}: Omit<Props, "listStyle">) {
  const { t } = useTranslation(currentLanguage)
  const title = product.title[currentLanguage] || product.title.tr || ""
  const description = product.description[currentLanguage] || product.description.tr || ""
  const outOfStock = isOutOfStockProduct(product.tags)
  const ribbon = resolveProductRibbon(product.tags)
  const price = parseFloat(product.price)
  const meta = formatProductMetaSummary(product, t)
  const displayTags = getInlineProductTags(product.tags, 2)
  const spiceLevel = getProductSpiceLevel(product)

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onClick()
        }
      }}
      className={cn(
        "menu-list-row menu-list-row--card group relative flex w-full gap-3.5 overflow-hidden px-4 py-3.5 text-left transition-colors active:bg-muted/40",
        className,
      )}
    >
      {ribbon ? (
        <ProductStatusRibbon label={t(ribbon.labelKey)} variant={ribbon.type} />
      ) : null}

      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-muted">
        <img
          src={withBasePath(product.image?.url || "/placeholder.svg")}
          alt={product.image?.alt || title}
          className={cn("h-full w-full object-cover", outOfStock && "opacity-50 grayscale")}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3
            className={cn(
              "line-clamp-2 text-base font-bold leading-snug tracking-tight text-foreground",
              outOfStock && "opacity-60",
            )}
          >
            {title}
          </h3>
          <ProductSpiceIndicator level={spiceLevel} />
        </div>

        {meta ? <p className="mt-0.5 text-sm text-muted-foreground">{meta}</p> : null}

        {description ? (
          <p className="mt-1.5 line-clamp-2 text-sm leading-snug text-muted-foreground">{description}</p>
        ) : null}

        {displayTags.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {displayTags.map((tag) => (
              <ProductTagBadge key={tag} tag={tag} label={t(`tags.${tag}`)} />
            ))}
          </div>
        ) : null}

        <div className="mt-2 flex items-center justify-between gap-3">
          <ProductPrice
            amount={price}
            currency={settings.default_currency || "TRY"}
            language={currentLanguage}
          />
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-active:bg-primary/20"
            aria-hidden
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
          </span>
        </div>
      </div>
    </article>
  )
}

export function ProductListRow({
  product,
  currentLanguage,
  settings,
  onClick,
  listStyle = "classic",
  className,
}: Props) {
  const { t } = useTranslation(currentLanguage)
  const title = product.title[currentLanguage] || product.title.tr || ""
  const description = product.description[currentLanguage] || product.description.tr || ""
  const outOfStock = isOutOfStockProduct(product.tags)
  const ribbon = resolveProductRibbon(product.tags)
  const price = parseFloat(product.price)
  const spiceLevel = getProductSpiceLevel(product)

  if (listStyle === "card") {
    return (
      <ProductListCard
        product={product}
        currentLanguage={currentLanguage}
        settings={settings}
        onClick={onClick}
        className={className}
      />
    )
  }

  const imageSize =
    listStyle === "compact" ? "h-12 w-12 rounded-lg" : "h-[4.5rem] w-[4.5rem] rounded-xl"

  const rowClass =
    listStyle === "compact"
      ? "menu-list-row menu-list-row--compact group flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors active:bg-muted/60"
      : "menu-list-row group flex w-full items-start gap-3.5 px-4 py-3.5 text-left transition-colors active:bg-muted/60"

  return (
    <button type="button" onClick={onClick} className={cn(rowClass, className)}>
      <div className={cn("relative shrink-0 overflow-hidden bg-muted", imageSize)}>
        <img
          src={withBasePath(product.image?.url || "/placeholder.svg")}
          alt={product.image?.alt || title}
          className={cn("h-full w-full object-cover", outOfStock && "opacity-50 grayscale")}
        />
      </div>

      <div className="min-w-0 flex-1 self-center">
        {listStyle === "compact" ? (
          <div className="space-y-1">
            {ribbon ? (
              <ProductStatusRibbon
                label={t(ribbon.labelKey)}
                variant={ribbon.type}
                placement="inline"
                size="sm"
              />
            ) : null}
            <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
            <h3
              className={cn(
                "truncate text-sm font-semibold text-foreground",
                outOfStock && "opacity-60",
              )}
            >
              {title}
            </h3>
            <ProductSpiceIndicator level={spiceLevel} />
            </div>
            <ProductPrice
              amount={price}
              currency={settings.default_currency || "TRY"}
              language={currentLanguage}
              size="sm"
            />
          </div>
          </div>
        ) : (
          <>
            {ribbon ? (
              <ProductStatusRibbon
                label={t(ribbon.labelKey)}
                variant={ribbon.type}
                placement="inline"
                className="mb-1.5"
              />
            ) : null}
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-start gap-1.5">
                <h3
                  className={cn(
                    "line-clamp-2 text-[15px] font-semibold leading-snug text-foreground",
                    outOfStock && "opacity-60",
                  )}
                >
                  {title}
                </h3>
                <ProductSpiceIndicator level={spiceLevel} className="mt-0.5" />
              </div>
              <ProductPrice
                amount={price}
                currency={settings.default_currency || "TRY"}
                language={currentLanguage}
                size="sm"
                className="shrink-0"
              />
            </div>
            {description ? (
              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{description}</p>
            ) : null}
          </>
        )}
      </div>

      {listStyle !== "compact" ? (
        <ChevronRight className="mt-5 h-4 w-4 shrink-0 self-start text-muted-foreground/50 transition-transform group-active:translate-x-0.5" />
      ) : null}
    </button>
  )
}
