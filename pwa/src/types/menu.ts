export interface MenuData {
  success: boolean
  data: {
    categories: Category[]
    languages: string[]
    settings: RestaurantSettings
  }
}

export interface Category {
  id: string
  slug: string
  public_url?: string
  name: Record<string, string>
  description: Record<string, string>
  products?: Product[]
  subcategories?: Subcategory[]
}

export interface Subcategory {
  id: string
  slug: string
  public_url?: string
  name: Record<string, string>
  description: Record<string, string>
  products?: Product[]
}

export interface Product {
  id: string
  public_url?: string
  title: Record<string, string>
  description: Record<string, string>
  price: string
  weight?: string
  portion_size?: string
  spice_level?: string
  preparation_time?: string
  tags?: string[]
  image?: {
    url: string
    alt?: string
    width?: number
    height?: number
  }
  nutrition?: NutritionItem[]
  ingredients?: Record<string, IngredientItem[]>
  allergens?: Record<string, string[]>
  origin_country?: string
  additives?: string[]
}

export interface NutritionItem {
  name: string
  value: string
}

export interface IngredientItem {
  name: string
  amount: string
}

export interface Language {
  code: string
  name: string
  flag: string
}

export interface ThemePalette {
  background: string
  surface: string
  text: string
  text_muted: string
  primary: string
  accent: string
  border: string
  header: string
}

export interface ThemeConfig {
  preset: string
  light: ThemePalette
  dark: ThemePalette
}

export interface RestaurantSettings {
  title: string
  description: string
  logo: string
  header_background?: string
  default_language: string
  default_currency: string
  colors: {
    primary: string
    secondary: string
  }
  theme?: ThemeConfig
  wifi: {
    ssid: string
    password: string
  }
  workingHours: any
  themeMode: string,
  socialMedia: Record<string, string>
  information?: string
  privacy_policy_url?: string
  recaptcha?: {
    enabled: boolean
    site_key: string
  }
}

export interface ReviewData {
  service: number
  taste: number
  cleanliness: number
  comment: string
  customerName?: string
  customerEmail?: string
}
