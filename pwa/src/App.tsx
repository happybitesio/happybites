import { Category, Product } from "./types/menu"
import { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback } from "react"
import { MessageSquare, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LoadingScreen } from "./components/LoadingScreen"
import { ErrorScreen } from "./components/ErrorScreen"
import { MenuHeader } from "./components/menu/MenuHeader"
import { MenuToolbar } from "./components/menu/MenuToolbar"
import { CategoryNav } from "./components/menu/CategoryNav"
import { CategoryGrid } from "./components/menu/CategoryGrid"
import { ProductCatalog } from "./components/menu/ProductCatalog"
import { SectionHeading } from "./components/menu/SectionHeading"
import { FilterSheet } from "./components/menu/FilterSheet"
import { ReviewModal } from "./components/ReviewModal"
import { WiFiModal } from "./components/WiFiModal"
import { InfoModal } from "./components/InfoModal"
import { ProductDetailModal } from "./components/ProductDetailModal"
import { LanguageModal } from "./components/LanguageModal"
import { useMenuData } from "./hooks/useMenuData"
import { useTranslation } from "./hooks/useTranslation"
import { useViewMode } from "./hooks/useViewMode"
import { persistMenuLanguage, resolveMenuLanguage, useInitialMenuLanguage } from "./hooks/useMenuLanguage"
import {
  getAvailableTags,
  getFilteredProducts,
  searchProducts,
  findProductById,
  findCategoryBySlug,
  readMenuDeepLink,
  writeMenuDeepLink,
  categoryHasFilteredProducts,
} from "./utils/menuHelpers"
import { applyThemeVariables, getPalette, withResolvedColors } from "./utils/theme"
import { track } from "./utils/analytics"
import { syncBrowserChrome } from "./utils/browserChrome"
import { resolveAdminViewMode, resolveCategoryNavMode, resolveMenuEntryMode } from "./utils/menuDisplay"
import { getCategorySectionId, scrollToCategorySection, useCategoryScrollSpy } from "./utils/categoryScroll"

export default function App() {
  const { menuData, loading, error, refetch } = useMenuData()
  const defaultViewMode = resolveAdminViewMode(menuData?.data?.settings)
  const { viewMode, setViewMode } = useViewMode(defaultViewMode)

  const [currentLanguage, setCurrentLanguage] = useState(useInitialMenuLanguage)
  const [activeCategory, setActiveCategory] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [themeReady, setThemeReady] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedSpiceLevel, setSelectedSpiceLevel] = useState<number | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isProductOpen, setIsProductOpen] = useState(false)
  const [isLanguageOpen, setIsLanguageOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isWifiOpen, setIsWifiOpen] = useState(false)
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)

  const categories = menuData?.data?.categories ?? []
  const settings = menuData?.data.settings
  const categoryNavMode = resolveCategoryNavMode(settings)
  const menuEntryMode = resolveMenuEntryMode(settings)
  const isCategoryLanding = menuEntryMode === "categories" && showCategoryPicker && !searchQuery
  const isScrollNav =
    categoryNavMode === "scroll" && !searchQuery && menuEntryMode === "direct" && !isCategoryLanding
  const deepLinkScrolledRef = useRef(false)

  const visibleCategories = useMemo(
    () => categories.filter((category) => categoryHasFilteredProducts(category, selectedTags, selectedSpiceLevel)),
    [categories, selectedTags, selectedSpiceLevel],
  )

  const { scrollToCategory } = useCategoryScrollSpy({
    enabled: isScrollNav && visibleCategories.length > 0 && !loading && themeReady,
    slugs: visibleCategories.map((category) => category.slug),
    activeCategory,
    onActiveChange: setActiveCategory,
  })

  const { t } = useTranslation(currentLanguage)
  const theme = settings?.theme
  const palette = useMemo(() => getPalette(theme, isDarkMode), [theme, isDarkMode])

  // Apply restaurant theme before the first paint of the menu so default
  // orange tokens never flash on screen.
  useLayoutEffect(() => {
    if (!menuData) {
      setThemeReady(false)
      return
    }

    const dark = menuData.data.settings.themeMode === "dark"
    const nextPalette = getPalette(menuData.data.settings.theme, dark)
    applyThemeVariables(nextPalette)
    document.documentElement.classList.toggle("dark", dark)
    syncBrowserChrome(menuData.data.settings.appearance, dark, nextPalette.background)
    setIsDarkMode(dark)
    setThemeReady(true)
    document.documentElement.classList.remove("hb-booting")
    document.dispatchEvent(new CustomEvent("hb:app-ready"))
  }, [menuData])

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
    deepLinkScrolledRef.current = false

    const entryMode = resolveMenuEntryMode(menuData.data.settings)
    const shouldShowPicker =
      entryMode === "categories" && !deepLink.categorySlug && !deepLink.productId
    setShowCategoryPicker(shouldShowPicker)

    if (shouldShowPicker) {
      writeMenuDeepLink({ categorySlug: null })
    }

    if (deepLink.productId) {
      const linkedProduct = findProductById(menuData.data.categories, deepLink.productId)
      if (linkedProduct) {
        setSelectedProduct(linkedProduct)
        setIsProductOpen(true)
      }
    }

    const pageTitle = menuData.data.settings.title?.trim()
    if (pageTitle) {
      document.title = pageTitle
    }
  }, [menuData])

  useEffect(() => {
    if (!menuData || !isScrollNav || deepLinkScrolledRef.current) return

    const deepLink = readMenuDeepLink()
    if (!deepLink.categorySlug) return

    const slug = deepLink.categorySlug
    if (!findCategoryBySlug(menuData.data.categories, slug)) return

    const timer = window.setTimeout(() => {
      scrollToCategorySection(slug)
      deepLinkScrolledRef.current = true
    }, 120)

    return () => window.clearTimeout(timer)
  }, [menuData, isScrollNav])

  useEffect(() => {
    if (!isScrollNav || visibleCategories.length === 0) return

    if (!visibleCategories.some((category) => category.slug === activeCategory)) {
      setActiveCategory(visibleCategories[0].slug)
    }
  }, [isScrollNav, visibleCategories, activeCategory])

  // Keep CSS variables in sync when the user toggles light/dark after load.
  useEffect(() => {
    if (!themeReady || !menuData) return
    applyThemeVariables(palette)
    document.documentElement.classList.toggle("dark", isDarkMode)
    syncBrowserChrome(menuData.data.settings.appearance, isDarkMode, palette.background)
  }, [palette, isDarkMode, themeReady, menuData])

  const openProduct = (product: Product) => {
    setSelectedProduct(product)
    setIsProductOpen(true)
    writeMenuDeepLink({ productId: String(product.id) })
    track("product_view", {
      product_id: product.id,
      product_name: product.title[currentLanguage] || product.title.tr || "",
    })
  }

  const openProductById = (productId: string) => {
    const linkedProduct = findProductById(categories, productId)
    if (!linkedProduct) return
    openProduct(linkedProduct)
  }

  const openProductByIdRef = useRef(openProductById)
  openProductByIdRef.current = openProductById

  // Bridge for the HappyBites Pro stories island: expose menu data +
  // current language on window and accept product deep links via events.
  useEffect(() => {
    if (!menuData) return
    window.__HB_MENU_DATA__ = menuData
    document.dispatchEvent(new CustomEvent("hb:menu-ready"))
  }, [menuData])

  useEffect(() => {
    window.__HB_MENU_LANG__ = currentLanguage
    document.dispatchEvent(new CustomEvent("hb:menu-lang", { detail: currentLanguage }))
  }, [currentLanguage])

  useEffect(() => {
    const handler = (event: Event) => {
      const productId = (event as CustomEvent).detail?.productId
      if (productId) {
        openProductByIdRef.current(String(productId))
      }
    }

    document.addEventListener("hb:open-product", handler)
    return () => document.removeEventListener("hb:open-product", handler)
  }, [])

  // Debounced search tracking: report a search once typing settles.
  useEffect(() => {
    const query = searchQuery.trim()
    if (!query) return

    const timer = window.setTimeout(() => {
      track("search", { query })
    }, 900)

    return () => window.clearTimeout(timer)
  }, [searchQuery])

  const closeProduct = (open: boolean) => {
    setIsProductOpen(open)
    if (!open) {
      setSelectedProduct(null)
      writeMenuDeepLink({ productId: null })
    }
  }

  const handleCategorySelect = useCallback(
    (slug: string) => {
      track("category_view", { category: slug })

      if (isScrollNav) {
        scrollToCategory(slug)
        return
      }

      setActiveCategory(slug)
      writeMenuDeepLink({ categorySlug: slug })

      if (menuEntryMode === "categories") {
        setShowCategoryPicker(false)
        window.scrollTo({ top: 0, behavior: "smooth" })
      }
    },
    [isScrollNav, scrollToCategory, menuEntryMode],
  )

  // Bridge for HappyBites Pro islands (footer dock): jump to a category.
  const handleCategorySelectRef = useRef(handleCategorySelect)
  handleCategorySelectRef.current = handleCategorySelect

  useEffect(() => {
    const handler = (event: Event) => {
      const slug = (event as CustomEvent).detail?.categorySlug
      if (slug) {
        handleCategorySelectRef.current(String(slug))
      }
    }

    document.addEventListener("hb:open-category", handler)
    return () => document.removeEventListener("hb:open-category", handler)
  }, [])

  const handleCategoryPick = useCallback(
    (slug: string) => {
      setActiveCategory(slug)
      setShowCategoryPicker(false)
      writeMenuDeepLink({ categorySlug: slug })
      window.scrollTo({ top: 0, behavior: "smooth" })
      track("category_view", { category: slug })
    },
    [],
  )

  const handleBackToCategories = useCallback(() => {
    setShowCategoryPicker(true)
    writeMenuDeepLink({ categorySlug: null })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  if (error && !menuData) {
    return <ErrorScreen error={error || "Unknown error"} onRetry={refetch} currentLanguage={currentLanguage} />
  }

  if (loading || !menuData || !themeReady) {
    return <LoadingScreen currentLanguage={currentLanguage} />
  }

  const { languages } = menuData.data
  const themedSettings = withResolvedColors(settings!, palette)
  const availableTags = getAvailableTags(categories)
  const searchResults = searchProducts(categories, searchQuery, currentLanguage)
  const filterCount = selectedTags.length + (selectedSpiceLevel !== null ? 1 : 0)

  const isBento = viewMode === "bento"

  const renderSection = (title: string, description: string | undefined, products: Product[]) => {
    if (products.length === 0) return null
    return (
      <section className={isBento ? "space-y-2" : "space-y-3"}>
        <div className={isBento ? "px-3" : "px-4"}>
          <SectionHeading title={title} description={description} />
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

  const renderCategoryBlock = (category: Category) => {
    const mainProducts = getFilteredProducts(category.products || [], selectedTags, selectedSpiceLevel)
    const subSections = (category.subcategories || [])
      .map((subcategory) =>
        renderSection(
          subcategory.name[currentLanguage] || subcategory.name.tr,
          subcategory.description?.[currentLanguage] || subcategory.description?.tr,
          getFilteredProducts(subcategory.products || [], selectedTags, selectedSpiceLevel),
        ),
      )
      .filter(Boolean)

    if (mainProducts.length === 0 && subSections.length === 0) {
      return null
    }

    return (
      <div key={category.slug} id={getCategorySectionId(category.slug)} className="scroll-mt-[52px] space-y-6">
        {mainProducts.length > 0
          ? renderSection(
              category.name[currentLanguage] || category.name.tr,
              category.description[currentLanguage] || category.description.tr,
              mainProducts,
            )
          : null}
        {subSections}
      </div>
    )
  }

  const renderMenuContent = () => {
    if (isCategoryLanding) {
      return (
        <CategoryGrid
          categories={categories}
          currentLanguage={currentLanguage}
          onSelect={handleCategoryPick}
          className="pb-2"
        />
      )
    }

    if (searchQuery) {
      return (
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
      )
    }

    if (isScrollNav) {
      return visibleCategories.map((category) => renderCategoryBlock(category))
    }

    return categories
      .filter((category: Category) => category.slug === activeCategory)
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
  }

  return (
    <div className="menu-app mx-auto min-h-[100dvh] w-full max-w-md bg-background text-foreground shadow-2xl shadow-black/5 md:max-w-none md:shadow-none">
      <MenuHeader
        settings={themedSettings}
        isDarkMode={isDarkMode}
        currentLanguage={currentLanguage}
        onLanguageClick={() => setIsLanguageOpen(true)}
        onDarkModeToggle={() => setIsDarkMode(!isDarkMode)}
        onWifiClick={() => setIsWifiOpen(true)}
        onInfoClick={() => setIsInfoOpen(true)}
      />

      {/* HappyBites Pro stories island mounts here when installed. The node
          must stay in the DOM (the island owns its React root), so we hide
          it during search instead of unmounting it. */}
      <div id="hb-stories-slot" hidden={Boolean(searchQuery)} />

      <MenuToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        currentLanguage={currentLanguage}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        filterCount={filterCount}
        onFilterClick={() => setIsFilterOpen(true)}
        showViewMode={!isCategoryLanding}
      />

      <main className="menu-main">
        {!isCategoryLanding ? (
          <CategoryNav
            categories={isScrollNav ? visibleCategories : categories}
            activeCategory={activeCategory}
            currentLanguage={currentLanguage}
            onCategorySelect={handleCategorySelect}
            onAllCategoriesClick={
              menuEntryMode === "categories" && !searchQuery ? handleBackToCategories : undefined
            }
            allCategoriesLabel={t("menu.backToCategories")}
          />
        ) : null}

        <div
          className={
            isCategoryLanding ? "py-4" : isBento ? "space-y-4 px-3 py-4" : "space-y-6 py-4"
          }
        >
          {renderMenuContent()}
        </div>
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
        {themedSettings.show_credit ? (
          <p
            className="text-xs text-muted-foreground [&_a]:font-medium [&_a]:text-primary [&_a]:no-underline hover:[&_a]:underline"
            dangerouslySetInnerHTML={{ __html: t("restaurant.allRightsReserved") }}
          />
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
          track("language_change", { language: code })
        }}
      />

      <WiFiModal isOpen={isWifiOpen} onOpenChange={setIsWifiOpen} settings={themedSettings} currentLanguage={currentLanguage} />

      <InfoModal isOpen={isInfoOpen} onOpenChange={setIsInfoOpen} settings={themedSettings} currentLanguage={currentLanguage} />

      <ReviewModal isOpen={isReviewOpen} onOpenChange={setIsReviewOpen} currentLanguage={currentLanguage} settings={themedSettings} />

    </div>
  )
}
