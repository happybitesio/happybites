import { useState, useEffect, useMemo } from "react"
import { MessageSquare, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LoadingScreen } from "./components/LoadingScreen"
import { ErrorScreen } from "./components/ErrorScreen"
import { MenuHeader } from "./components/menu/MenuHeader"
import { MenuToolbar } from "./components/menu/MenuToolbar"
import { ProductCatalog } from "./components/menu/ProductCatalog"
import { FilterSheet } from "./components/menu/FilterSheet"
import { ReviewModal } from "./components/ReviewModal"
import { WiFiModal } from "./components/WiFiModal"
import { InfoModal } from "./components/InfoModal"
import { ProductDetailModal } from "./components/ProductDetailModal"
import { LanguageModal, SocialModal } from "./components/LanguageModal"
import { useMenuData } from "./hooks/useMenuData"
import { useTranslation } from "./hooks/useTranslation"
import { useViewMode } from "./hooks/useViewMode"
import { persistMenuLanguage, resolveMenuLanguage, useInitialMenuLanguage } from "./hooks/useMenuLanguage"
import { getAvailableTags, getFilteredProducts, searchProducts, findProductById, findCategoryBySlug, readMenuDeepLink, writeMenuDeepLink } from "./utils/menuHelpers"
import { applyThemeVariables, getPalette, withResolvedColors } from "./utils/theme"
import { Product, Category } from "./types/menu"

export default function App() {
  const { menuData, loading, error, refetch } = useMenuData()
  const { viewMode, setViewMode } = useViewMode()

  const [currentLanguage, setCurrentLanguage] = useState(useInitialMenuLanguage)
  const [activeCategory, setActiveCategory] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedSpiceLevel, setSelectedSpiceLevel] = useState<number | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isProductOpen, setIsProductOpen] = useState(false)
  const [isLanguageOpen, setIsLanguageOpen] = useState(false)
  const [isSocialOpen, setIsSocialOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isWifiOpen, setIsWifiOpen] = useState(false)
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const [isReviewOpen, setIsReviewOpen] = useState(false)

  const { t } = useTranslation(currentLanguage)
  const theme = menuData?.data?.settings?.theme
  const palette = useMemo(() => getPalette(theme, isDarkMode), [theme, isDarkMode])

  useEffect(() => {
    if (!menuData) return
    const langs = menuData.data.languages.map((l: string) => l || "en")
    const defaultLang = menuData.data.settings.default_language || langs[0] || "en"
    setCurrentLanguage(resolveMenuLanguage(langs, defaultLang))

    const deepLink = readMenuDeepLink()
    const linkedCategory = deepLink.categorySlug
      ? findCategoryBySlug(menuData.data.categories, deepLink.categorySlug)
      : null

    setActiveCategory(linkedCategory?.slug || menuData.data.categories[0]?.slug || "")

    if (deepLink.productId) {
      const linkedProduct = findProductById(menuData.data.categories, deepLink.productId)
      if (linkedProduct) {
        setSelectedProduct(linkedProduct)
        setIsProductOpen(true)
      }
    }

    setIsDarkMode(menuData.data.settings.themeMode === "dark")
  }, [menuData])

  useEffect(() => {
    applyThemeVariables(palette)
    document.documentElement.classList.toggle("dark", isDarkMode)
  }, [palette, isDarkMode])

  const openProduct = (product: Product) => {
    setSelectedProduct(product)
    setIsProductOpen(true)
    writeMenuDeepLink({ productId: String(product.id) })
  }

  const closeProduct = (open: boolean) => {
    setIsProductOpen(open)
    if (!open) {
      setSelectedProduct(null)
      writeMenuDeepLink({ productId: null })
    }
  }

  if (loading) return <LoadingScreen currentLanguage={currentLanguage} />
  if (error || !menuData) {
    return <ErrorScreen error={error || "Unknown error"} onRetry={refetch} currentLanguage={currentLanguage} />
  }

  const { categories, settings, languages } = menuData.data
  const themedSettings = withResolvedColors(settings, palette)
  const availableTags = getAvailableTags(categories)
  const searchResults = searchProducts(categories, searchQuery, currentLanguage)
  const filterCount = selectedTags.length + (selectedSpiceLevel !== null ? 1 : 0)

  const renderSection = (title: string, description: string | undefined, products: Product[]) => {
    if (products.length === 0) return null
    return (
      <section className="space-y-3">
        <div className="px-4">
          <h2 className="text-base font-bold tracking-tight text-foreground">{title}</h2>
          {description ? <p className="mt-0.5 text-sm text-muted-foreground">{description}</p> : null}
        </div>
        <ProductCatalog
          products={products}
          viewMode={viewMode}
          currentLanguage={currentLanguage}
          settings={themedSettings}
          onProductClick={openProduct}
        />
      </section>
    )
  }

  return (
    <div className="menu-app mx-auto min-h-[100dvh] w-full max-w-md bg-background text-foreground shadow-2xl shadow-black/5 md:max-w-none md:shadow-none">
      <MenuHeader
        settings={themedSettings}
        isDarkMode={isDarkMode}
        currentLanguage={currentLanguage}
        onLanguageClick={() => setIsLanguageOpen(true)}
        onSocialClick={() => setIsSocialOpen(true)}
        onDarkModeToggle={() => setIsDarkMode(!isDarkMode)}
        onWifiClick={() => setIsWifiOpen(true)}
        onInfoClick={() => setIsInfoOpen(true)}
      />

      <MenuToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categories={categories}
        activeCategory={activeCategory}
        onCategorySelect={setActiveCategory}
        currentLanguage={currentLanguage}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        filterCount={filterCount}
        onFilterClick={() => setIsFilterOpen(true)}
      />

      <main className="menu-main space-y-6 py-4">
        {searchQuery ? (
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-4 text-sm">
              <Search className="h-4 w-4 text-primary" />
              <span className="font-medium">
                "{searchQuery}" {t("menu.searchResults")}
              </span>
              <span className="ml-auto text-xs text-muted-foreground">
                {searchResults.length} {t("common.results")}
              </span>
            </div>
            {searchResults.length > 0 ? (
              <ProductCatalog
                products={searchResults}
                viewMode={viewMode}
                currentLanguage={currentLanguage}
                settings={themedSettings}
                onProductClick={openProduct}
              />
            ) : (
              <div className="px-4 py-16 text-center">
                <Search className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
                <p className="font-medium">{t("menu.noResults")}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t("menu.noResultsDescription")}</p>
              </div>
            )}
          </section>
        ) : (
          categories
            .filter((c: Category) => c.slug === activeCategory)
            .map((category: Category) => (
              <div key={category.slug} className="space-y-6">
                {category.products
                  ? renderSection(
                      category.name[currentLanguage] || category.name.tr,
                      category.description[currentLanguage] || category.description.tr,
                      getFilteredProducts(category.products, selectedTags, selectedSpiceLevel),
                    )
                  : null}

                {category.subcategories?.map((sub) =>
                  renderSection(
                    sub.name[currentLanguage] || sub.name.tr,
                    sub.description?.[currentLanguage] || sub.description?.tr,
                    getFilteredProducts(sub.products || [], selectedTags, selectedSpiceLevel),
                  ),
                )}
              </div>
            ))
        )}
      </main>

      <footer className="menu-footer px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2 text-center">
        <Button
          variant="outline"
          className="mb-4 h-11 w-full rounded-2xl border-border/60 bg-card"
          onClick={() => setIsReviewOpen(true)}
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          {t("review.title")}
        </Button>
        <p
          className="text-xs text-muted-foreground [&_a]:font-medium [&_a]:text-primary [&_a]:no-underline hover:[&_a]:underline"
          dangerouslySetInnerHTML={{ __html: t("restaurant.allRightsReserved") }}
        />
        {themedSettings.privacy_policy_url ? (
          <p className="mt-2 text-xs text-muted-foreground">
            <a href={themedSettings.privacy_policy_url} target="_blank" rel="noreferrer">
              {t("common.privacyPolicy")}
            </a>
          </p>
        ) : null}
      </footer>

      <ProductDetailModal
        isOpen={isProductOpen}
        onOpenChange={closeProduct}
        product={selectedProduct}
        currentLanguage={currentLanguage}
        settings={themedSettings}
      />

      <FilterSheet
        open={isFilterOpen}
        onOpenChange={setIsFilterOpen}
        selectedTags={selectedTags}
        selectedSpiceLevel={selectedSpiceLevel}
        availableTags={availableTags}
        currentLanguage={currentLanguage}
        onToggleTag={(tag) =>
          setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
        }
        onSetSpiceFilter={setSelectedSpiceLevel}
        onClearFilters={() => {
          setSelectedTags([])
          setSelectedSpiceLevel(null)
        }}
      />

      <LanguageModal
        open={isLanguageOpen}
        onOpenChange={setIsLanguageOpen}
        languages={languages}
        currentLanguage={currentLanguage}
        onSelect={(code) => {
          setCurrentLanguage(code)
          persistMenuLanguage(code)
          setIsLanguageOpen(false)
        }}
      />

      <SocialModal open={isSocialOpen} onOpenChange={setIsSocialOpen} socialMedia={settings.socialMedia} currentLanguage={currentLanguage} />

      <WiFiModal isOpen={isWifiOpen} onOpenChange={setIsWifiOpen} settings={themedSettings} currentLanguage={currentLanguage} />

      <InfoModal isOpen={isInfoOpen} onOpenChange={setIsInfoOpen} settings={themedSettings} currentLanguage={currentLanguage} />

      <ReviewModal isOpen={isReviewOpen} onOpenChange={setIsReviewOpen} currentLanguage={currentLanguage} settings={themedSettings} />
    </div>
  )
}
