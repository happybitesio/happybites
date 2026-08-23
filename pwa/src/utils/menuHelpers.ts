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
      const productSpiceLevel = parseInt(product.spice_level || "0")
      if (productSpiceLevel !== selectedSpiceLevel) return false
    }

    return true
  })
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

export const formatPrice = (
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
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