import { Product, Category, Language } from '../types/menu'

export const getAllProducts = (categories: Category[]): Product[] => {
  const allProducts: Product[] = []

  categories.forEach((category) => {
    // Add main category products
    if (category.products) {
      category.products.forEach((product) => {
        allProducts.push({
          ...product,
          categoryId: category.id,
          categorySlug: category.slug
        } as any)
      })
    }

    // Add subcategory products
    if (category.subcategories) {
      category.subcategories.forEach((subcategory) => {
        if (subcategory.products) {
          subcategory.products.forEach((product) => {
            allProducts.push({
              ...product,
              categoryId: category.id,
              categorySlug: category.slug,
              subcategoryId: subcategory.id,
            } as any)
          })
        }
      })
    }
  })

  return allProducts
}

export const findProductById = (categories: Category[], productId: string): Product | null => {
  const normalizedId = String(productId)
  return getAllProducts(categories).find((product) => String(product.id) === normalizedId) || null
}

export const findCategoryBySlug = (categories: Category[], slug: string): Category | null => {
  return categories.find((category) => category.slug === slug) || null
}

export const readMenuDeepLink = (): { productId: string | null; categorySlug: string | null } => {
  const params = new URLSearchParams(window.location.search)
  return {
    productId: params.get('product'),
    categorySlug: params.get('category'),
  }
}

export const writeMenuDeepLink = (next: { productId?: string | null; categorySlug?: string | null }) => {
  const url = new URL(window.location.href)

  if (next.productId) {
    url.searchParams.set('product', next.productId)
  } else {
    url.searchParams.delete('product')
  }

  if (next.categorySlug) {
    url.searchParams.set('category', next.categorySlug)
  } else if (Object.prototype.hasOwnProperty.call(next, 'categorySlug')) {
    url.searchParams.delete('category')
  }

  window.history.replaceState({}, '', url.toString())
}

export const getAvailableTags = (categories: Category[]): string[] => {
  const allProducts = getAllProducts(categories)
  const tags = new Set<string>()

  allProducts.forEach((product) => {
    if (product.tags && Array.isArray(product.tags)) {
      product.tags.forEach((tag: string) => tags.add(tag))
    }
  })

  return Array.from(tags)
}

export const getFilteredProducts = (
  products: Product[],
  selectedTags: string[],
  selectedSpiceLevel: number | null
): Product[] => {
  return products.filter((product) => {
    // Tag filter
    if (selectedTags.length > 0) {
      const hasSelectedTag = selectedTags.some((tag) =>
        product.tags && Array.isArray(product.tags) && product.tags.includes(tag)
      )
      if (!hasSelectedTag) return false
    }

    // Spice level filter
    if (selectedSpiceLevel !== null) {
      const productSpiceLevel = getProductSpiceLevel(product)
      if (productSpiceLevel !== selectedSpiceLevel) return false
    }

    return true
  })
}

export function categoryHasFilteredProducts(
  category: Category,
  selectedTags: string[],
  selectedSpiceLevel: number | null,
): boolean {
  if (getFilteredProducts(category.products || [], selectedTags, selectedSpiceLevel).length > 0) {
    return true
  }

  return (category.subcategories || []).some(
    (subcategory) =>
      getFilteredProducts(subcategory.products || [], selectedTags, selectedSpiceLevel).length > 0,
  )
}

export const searchProducts = (
  categories: Category[],
  query: string,
  currentLanguage: string
): Product[] => {
  if (!query.trim()) return []

  const allProducts = getAllProducts(categories)
  return allProducts.filter((product) => {
    const title = product.title[currentLanguage]?.toLowerCase() || ""
    const description = product.description[currentLanguage]?.toLowerCase() || ""
    const searchTerm = query.toLowerCase()

    return title.includes(searchTerm) || description.includes(searchTerm)
  })
}

function resolvePriceLocale(language: string): string {
  const map: Record<string, string> = {
    tr: "tr-TR",
    en: "en-US",
    ro: "ro-RO",
    de: "de-DE",
    fr: "fr-FR",
    es: "es-ES",
    pt: "pt-BR",
    it: "it-IT",
    ru: "ru-RU",
    ar: "ar-SA",
    zh: "zh-CN",
    ja: "ja-JP",
    ko: "ko-KR",
  }

  return map[language] || language
}

export interface PriceDisplayParts {
  whole: string
  fraction: string | null
  decimalSeparator: string
  currency: string
  currencyIsPrefix: boolean
}

export function getPriceDisplayParts(
  amount: number,
  currency: string = "USD",
  language: string = "en",
): PriceDisplayParts {
  const locale = resolvePriceLocale(language)
  const normalized = Math.round(amount * 100) / 100
  const hasFraction = Math.abs(normalized % 1) >= 0.005

  const parts = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: hasFraction ? 2 : 0,
  }).formatToParts(normalized)

  let whole = ""
  let fraction: string | null = null
  let decimalSeparator = ""
  let currencyPart = ""
  const currencyIndex = parts.findIndex((part) => part.type === "currency")

  for (const part of parts) {
    if (part.type === "currency") {
      currencyPart = part.value
    } else if (part.type === "integer" || part.type === "group") {
      whole += part.value
    } else if (part.type === "decimal") {
      decimalSeparator = part.value
    } else if (part.type === "fraction") {
      fraction = part.value
    }
  }

  return {
    whole,
    fraction,
    decimalSeparator,
    currency: currencyPart,
    currencyIsPrefix: currencyIndex === 0,
  }
}

export const formatPrice = (
  amount: number,
  currency: string = "USD",
  language: string = "en",
): string => {
  const parts = getPriceDisplayParts(amount, currency, language)
  const amountText = parts.fraction
    ? `${parts.whole}${parts.decimalSeparator}${parts.fraction}`
    : parts.whole

  if (parts.currencyIsPrefix) {
    return `${parts.currency}${amountText}`
  }

  return `${amountText} ${parts.currency}`.trim()
}

// Dil kodunu ülke koduna eşleyen basit bir harita
const langToCountryMap: Record<string, string> = {
  tr: "TR",
  en: "US",
  en_GB: "GB",
  fr: "FR",
  de: "DE",
  ar: "SA",
  zh: "CN",
  ru: "RU",
  ja: "JP",
  es: "ES",
  it: "IT",
  pt: "PT",
  nl: "NL",
  pl: "PL",
  ro: "RO",
  sk: "SK",
  sl: "SI",
  sv: "SE",
  uk: "UA",
  vi: "VN",
  zh_TW: "TW",
  zh_HK: "HK",
  zh_CN: "CN",
  zh_SG: "SG",
  zh_MO: "MO",
  fa: "IR",
  he: "IL",
  ar_SA: "SA",
  ar_AE: "AE",
  ar_BH: "BH",
  ar_DZ: "DZ",
};

// Ülke kodundan Unicode bayrak emojisi üretir
function getFlagEmoji(countryCode: string): string {
  return countryCode
    .toUpperCase()
    .replace(/./g, char =>
      String.fromCodePoint(127397 + char.charCodeAt(0))
    );
}

// Ana fonksiyon
export function getLanguageInfo(
  langCode: string,
  displayLocale: string = 'en'
): Language {
  const countryCode = langToCountryMap[langCode] || langCode.toUpperCase();
  const flag = getFlagEmoji(countryCode);

  const displayNames = new Intl.DisplayNames([displayLocale], {
    type: 'language',
  });

  const name = capitalizeFirstLetter(displayNames.of(langCode) || langCode);

  return {
    code: langCode,
    name,
    flag,
  };
}

export function capitalizeFirstLetter(text: string): any {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function hasUnitSuffix(value: string): boolean {
  return /[a-zA-Z%]/.test(value)
}

export function getProductSpiceLevel(product: Pick<Product, "spice_level">): number {
  const level = parseInt(product.spice_level || "0", 10)
  if (!Number.isFinite(level) || level <= 0) return 0
  return Math.min(level, 3)
}

export function formatProductWeight(
  weight: string | undefined,
  weightUnit: string,
): string | null {
  const value = weight?.trim()
  if (!value) return null
  if (hasUnitSuffix(value)) return value
  return `${value}${weightUnit}`
}

export function formatProductPortion(
  portionSize: string | undefined,
  portionLabel: string,
): string | null {
  const value = portionSize?.trim()
  if (!value) return null
  if (hasUnitSuffix(value)) return value
  if (/^\d+([.,]\d+)?$/.test(value)) {
    return `${portionLabel}${value}`
  }
  return value
}

export function formatProductMetaSummary(
  product: Pick<Product, "weight" | "portion_size">,
  t: (key: string) => string,
): string | null {
  const parts = [
    formatProductWeight(product.weight, t("menu.weight")),
    formatProductPortion(product.portion_size, t("menu.portion")),
  ].filter((part): part is string => Boolean(part))

  return parts.length > 0 ? parts.join(" · ") : null
}

export type ProductRibbonType = "out_of_stock" | "popular" | "new_product"

export interface ProductRibbon {
  type: ProductRibbonType
  labelKey: string
}

const RIBBON_PRIORITY: ProductRibbonType[] = ["out_of_stock", "popular", "new_product"]

const RIBBON_LABEL_KEYS: Record<ProductRibbonType, string> = {
  out_of_stock: "tags.ribbon.sold_out",
  popular: "tags.ribbon.popular",
  new_product: "tags.ribbon.new",
}

const RIBBON_TAG_SET = new Set<string>(RIBBON_PRIORITY)

export function resolveProductRibbon(tags?: string[]): ProductRibbon | null {
  if (!tags?.length) return null

  for (const type of RIBBON_PRIORITY) {
    if (tags.includes(type)) {
      return { type, labelKey: RIBBON_LABEL_KEYS[type] }
    }
  }

  return null
}

export function isOutOfStockProduct(tags?: string[]): boolean {
  return tags?.includes("out_of_stock") ?? false
}

export function getInlineProductTags(tags?: string[], limit = 2): string[] {
  return (tags ?? [])
    .filter((tag) => !RIBBON_TAG_SET.has(tag))
    .slice(0, limit)
}