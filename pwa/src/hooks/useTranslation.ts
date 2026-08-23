import { useEffect, useState } from 'react'
import withBasePath from '@/utils/basePath'

type TranslationKey = string
type TranslationValue = string | Record<string, any>
type Translations = Record<TranslationKey, TranslationValue>

const translationCache: Record<string, Translations> = {}
const inFlightRequests: Record<string, Promise<Translations>> = {}

// Fallback translations for critical UI elements
const fallbackTranslations: Translations = {
    'common': {
      'loading': 'Loading...',
      'error': 'Error',
      'success': 'Success',
      'cancel': 'Cancel',
      'close': 'Close',
      'closed': 'Closed',
      'save': 'Save',
      'submit': 'Submit',
      'clear': 'Clear',
      'all': 'All',
      'search': 'Search',
      'filter': 'Filter',
      'results': 'results',
      'privacyPolicy': 'Privacy Policy'
    },
    'menu': {
      'loading': 'Loading Menu...',
      'loadingDescription': 'Please wait',
      'loadError': 'Failed to Load Menu',
      'tryAgain': 'Try Again',
      'searchPlaceholder': 'Search food...',
      'searchResults': 'Search results for',
      'noResults': 'No results found',
      'noResultsDescription': 'Try different keywords',
      'categories': 'Categories',
      'features': 'Features',
      'description': 'Description',
      'ingredients': 'Ingredients',
      'allergens': 'Allergen Warning',
      'origin': 'Origin',
      'additives': 'Additives',
      'nutritionFacts': 'Nutrition Facts',
      'portion': 'Portion: ',
      'spiceLevel': 'Spice Level',
      'weight': 'g',
      'minutes': 'min',
      'viewList': 'List view',
      'viewBento': 'Bento view'
    },
    'filters': {
      'title': 'Filters',
      'tags': 'Tags',
      'spiceLevel': 'Spice Level',
      'clearAll': 'Clear All Filters'
    },
    'tags': {
      'popular': 'Popular',
      'chef_special': 'Chef\'s Special',
      'vegetarian': 'Vegetarian',
      'vegan': 'Vegan',
      'organic': 'Organic',
      'spicy': 'Spicy',
      'new_product': 'New Product',
      'gluten_free': 'Gluten Free',
      'lactose_free': 'Lactose Free',
      'seasonal': 'Seasonal',
      'halal': 'Halal',
      'kosher': 'Kosher',
      'low_calorie': 'Low Calorie',
      'out_of_stock': 'Out of Stock'
    },
    'restaurant': {
      'open': 'Open',
      'wifi': 'WiFi',
      'organicIngredients': 'Organic Ingredients',
      'freshlyPrepared': 'Freshly Prepared',
      'traditionalFlavors': 'Traditional Flavors',
      'allRightsReserved': 'Created by <a href="https://happybites.io" target="_blank" class="text-primary">Happybites</a>.'
    },
    'language': {
      'select': 'Select Language'
    },
    'social': {
      'title': 'Social Media'
    },
    'wifi': {
      'title': 'WiFi Connection Information',
      'description': 'Scan QR code to connect to WiFi',
      'ssid': 'SSID',
      'password': 'Password',
      'copy': 'Copy',
      'copied': 'Copied'
    },
    'information': {
      'title': 'Additional Info',
      'shortLabel': 'Info'
    },
    'review': {
      'title': 'Rate Us',
      'rateExperience': 'Rate Your Experience',
      'service': 'Service',
      'taste': 'Taste',
      'cleanliness': 'Cleanliness',
      'comments': 'Your Comments',
      'commentsPlaceholder': 'Share your experience with us...',
      'submitting': 'Submitting...',
      'submitError': 'Could not submit your review. Please try again.',
      'privacyNotice': 'Submitted data is processed under our',
      'privacyPolicy': 'Privacy Policy',
      'thankYou': 'Thank You!',
      'thankYouMessage': 'Your feedback is very valuable to us. Thank you for your review!',
      'customerInfoNote': 'You can optionally share your contact information. This helps us provide you with better service!',
      'customerName': 'Your Name',
      'customerNamePlaceholder': 'Enter your name',
      'customerEmail': 'Your Email',
      'customerEmailPlaceholder': 'example@email.com',
      'optional': 'Optional'
    }
}

// Note: We do not need NODE_ENV here; keeping logic environment-agnostic

function isRecord(value: unknown): value is Record<string, TranslationValue> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function mergeTranslations(base: Translations, override: Translations): Translations {
  const result: Translations = { ...base }

  for (const [key, overrideValue] of Object.entries(override)) {
    const baseValue = result[key]
    if (isRecord(baseValue) && isRecord(overrideValue)) {
      result[key] = mergeTranslations(baseValue, overrideValue)
    } else {
      result[key] = overrideValue
    }
  }

  return result
}

function lookupTranslation(source: Translations, key: string): string | undefined {
  const keys = key.split('.')
  let value: TranslationValue = source

  for (const part of keys) {
    if (!isRecord(value) || !(part in value)) {
      return undefined
    }
    value = value[part]
  }

  return typeof value === 'string' ? value : undefined
}

export const useTranslation = (language: string = 'en') => {
  const [translations, setTranslations] = useState<Translations>(() => {
    const cached = translationCache[language]
    return cached ? mergeTranslations(fallbackTranslations, cached) : fallbackTranslations
  })
  const [loading, setLoading] = useState(!translationCache[language])

  useEffect(() => {
    let isCancelled = false

    // If cached, update state immediately and stop loading
    if (translationCache[language]) {
      setTranslations(mergeTranslations(fallbackTranslations, translationCache[language]))
      setLoading(false)
      return
    }

    setLoading(true)

    // Deduplicate concurrent requests across multiple components
    if (!inFlightRequests[language]) {
      const url = withBasePath(`/locales/${language}.json`)
      inFlightRequests[language] = fetch(url)
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
          return response.json()
        })
        .then((data: Translations) => {
          const merged = mergeTranslations(fallbackTranslations, data)
          translationCache[language] = merged
          return merged
        })
        .catch((error) => {
          console.error(`Failed to load translations for ${language}:`, error)
          translationCache[language] = fallbackTranslations
          return fallbackTranslations
        })
        .finally(() => {
          delete inFlightRequests[language]
        })
    }

    inFlightRequests[language]
      .then((data) => {
        if (isCancelled) return
        setTranslations(data)
      })
      .finally(() => {
        if (isCancelled) return
        setLoading(false)
      })

    return () => {
      isCancelled = true
    }
  }, [language])

  const t = (key: string): string => {
    return lookupTranslation(translations, key) ?? lookupTranslation(fallbackTranslations, key) ?? key
  }

  return { t, loading }
}

