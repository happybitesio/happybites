import { Product, RestaurantSettings } from "@/types/menu"
import { ViewMode } from "@/hooks/useViewMode"
import { resolveListStyle } from "@/utils/menuDisplay"
import { ProductListRow } from "./ProductListRow"
import { ProductBentoGrid } from "./ProductBentoGrid"

interface Props {
  products: Product[]
  viewMode: ViewMode
  currentLanguage: string
  settings: RestaurantSettings
  onProductClick: (product: Product) => void
}

export function ProductCatalog({
  products,
  viewMode,
  currentLanguage,
  settings,
  onProductClick,
}: Props) {
  if (products.length === 0) return null

  if (viewMode === "bento") {
    return (
      <ProductBentoGrid
        products={products}
        currentLanguage={currentLanguage}
        settings={settings}
        onProductClick={onProductClick}
      />
    )
  }

  const listStyle = resolveListStyle(settings)

  if (listStyle === "card") {
    return (
      <div className="menu-list menu-list--card divide-y divide-border/60 overflow-hidden bg-card">
        {products.map((product) => (
          <ProductListRow
            key={product.id}
            product={product}
            currentLanguage={currentLanguage}
            settings={settings}
            listStyle="card"
            onClick={() => onProductClick(product)}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="menu-list divide-y divide-border/60 overflow-hidden bg-card">
      {products.map((product) => (
        <ProductListRow
          key={product.id}
          product={product}
          currentLanguage={currentLanguage}
          settings={settings}
          listStyle={listStyle}
          onClick={() => onProductClick(product)}
        />
      ))}
    </div>
  )
}
