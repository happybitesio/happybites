export interface MenuData {
  success: boolean
  data: {
    categories: Category[]
    stories?: MenuStory[]
    languages: string[]
    settings: RestaurantSettings
  }
}

export interface MenuStory {
  id: string
  sortOrder: number
  type: "image" | "video"
  durationMs: number
  media: Record<string, { url: string; posterUrl?: string | null }>
  title: Record<string, string>
  caption: Record<string, string>
  productId: number | null
}

export interface Category {
  id: string
  slug: string
  public_url?: string
  name: Record<string, string>
  description: Record<string, string>
  image?: {
    url: string
    alt?: string
  } | null
  products?: Product[]
  subcategories?: Subcategory[]
}

export interface Subcategory {
  id: string
  slug: string
  public_url?: string
  name: Record<string, string>
  description: Record<string, string>
  image?: {
    url: string
    alt?: string
  } | null
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

export interface ThemeAppearance {
  theme_color: {
    light: string
    dark: string
  }
  header_overlay: {
    light: number
    dark: number
  }
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
  appearance?: ThemeAppearance
  wifi: {
    ssid: string
    password: string
  }
  workingHours: any
  themeMode: string,
  socialMedia: Record<string, string>
  information?: string
  privacy_policy_url?: string
  /** Opt-in HappyBites credit link on the guest menu. Defaults to false. */
  show_credit?: boolean
  defaultViewMode?: "list" | "bento"
  listStyle?: "classic" | "compact" | "card"
  categoryNavMode?: "tabs" | "scroll"
  menuEntryMode?: "direct" | "categories"
  headerStyle?: "classic" | "centered"
  storiesEnabled?: boolean
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
