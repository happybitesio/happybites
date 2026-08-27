import type { HappyBitesAdminConfig } from '../vite-env';

export function getConfig(): HappyBitesAdminConfig {
  return (
    window.HAPPYBITES_ADMIN_CONFIG ?? {
      restUrl: '/wp-json/happybites/v1',
      nonce: '',
      adminUrl: '/wp-admin/',
      page: 'dashboard',
      pluginVersion: '2.0.2',
      locale: 'en_US',
      settings: {
        default_currency: 'TRY',
        default_language: 'en',
        languages: ['en'],
      },
      media: {
        title: 'Select or Upload Image',
        button: 'Use this image',
      },
    }
  );
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const config = getConfig();
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('X-WP-Nonce', config.nonce);

  const response = await fetch(`${config.restUrl}${path}`, {
    ...options,
    headers,
    credentials: 'same-origin',
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.success === false) {
    throw new ApiError(payload.message || `Request failed (${response.status})`, response.status);
  }

  return payload as T;
}

export const api = {
  getMenuTree: () => request<{ success: true; data: MenuTreeResponse }>('/admin/menu'),
  saveMenuOrder: (body: SaveOrderPayload) =>
    request<{ success: true; data: { saved_count: number } }>('/admin/menu/order', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  createCategory: (body: CategoryPayload) =>
    request<{ success: true; data: Category }>('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateCategory: (id: number, body: CategoryPayload) =>
    request<{ success: true; data: Category }>(`/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  deleteCategory: (id: number) =>
    request<{ success: true }>(`/admin/categories/${id}`, { method: 'DELETE' }),
  createProduct: (body: ProductPayload) =>
    request<{ success: true; data: ProductDetails }>('/admin/products', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getProduct: (id: number) =>
    request<{ success: true; data: ProductDetails }>(`/admin/products/${id}`),
  updateProduct: (id: number, body: ProductPayload) =>
    request<{ success: true; data: ProductDetails }>(`/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  deleteProduct: (id: number) =>
    request<{ success: true }>(`/admin/products/${id}`, { method: 'DELETE' }),
  setProductStatus: (id: number, status: ProductStatus) =>
    request<{ success: true; data: { id: number; status: ProductStatus } }>(`/admin/products/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  getSettings: () => request<{ success: true; data: SettingsData }>('/admin/settings'),
  updateSettings: (body: SettingsData) =>
    request<{ success: true; data: SettingsData }>('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  getReviews: (params: { page?: number; search?: string; status?: 'all' | 'read' | 'unread' }) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.search) query.set('search', params.search);
    if (params.status && params.status !== 'all') query.set('status', params.status);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request<{ success: true; data: ReviewsResponse }>(`/admin/reviews${suffix}`);
  },
  markReviewRead: (id: number) =>
    request<{ success: true }>(`/admin/reviews/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_read: true }),
    }),
  markAllReviewsRead: () =>
    request<{ success: true; data: { updated: number } }>('/admin/reviews/mark-all-read', {
      method: 'POST',
    }),
  deleteReview: (id: number) =>
    request<{ success: true }>(`/admin/reviews/${id}`, { method: 'DELETE' }),
};

export interface ProductIngredient {
  name: string;
  amount: string;
}

export interface ProductNutrition {
  name: string;
  value: string;
}

export interface LocalizedProductFields {
  title: string;
  description: string;
  ingredients: ProductIngredient[];
  allergens: string[];
  allergen_notes: string;
}

export type ProductStatus = 'publish' | 'draft';

export interface Product {
  id: number;
  title: string;
  price: number;
  order?: number;
  status?: ProductStatus;
  image?: string;
  image_id?: number;
  tags: string[];
  description: string;
  category_id?: number;
}

export interface ProductDetails {
  id?: number;
  title: string;
  price: number;
  order?: number;
  status?: ProductStatus;
  image?: string;
  image_id?: number;
  tags: string[];
  description: string;
  category_id?: number;
  languages: Record<string, LocalizedProductFields>;
  weight: string;
  origin_country: string;
  spice_level: string;
  preparation_time: string;
  portion_size: string;
  nutrition: ProductNutrition[];
  additives: string[];
}

export interface Category {
  id: number;
  name: string;
  parent_id?: number;
  description?: string;
  order?: number;
  image?: string;
  image_id?: number | null;
  products: Product[];
  subcategories: Category[];
}

export interface MenuTreeResponse {
  categories: Category[];
  uncategorizedProducts: Product[];
}

export interface SaveOrderPayload {
  categories: Array<{
    id: number;
    order: number;
    subcategories: Array<{
      id: number;
      order: number;
      products: Array<{ id: number; order: number; category_id: number }>;
    }>;
    products: Array<{ id: number; order: number; category_id: number }>;
  }>;
  uncategorizedProducts: Array<{ id: number; order: number }>;
}

export interface CategoryPayload {
  name: string;
  description?: string;
  parent_id?: number;
  image_id?: number | null;
}

export interface ProductPayload {
  title: string;
  description?: string;
  price?: number;
  category_id?: number;
  status?: ProductStatus;
  tags?: string[] | string;
  image_id?: number;
  image_touched?: boolean;
  languages?: Record<string, LocalizedProductFields>;
  weight?: string;
  origin_country?: string;
  spice_level?: string;
  preparation_time?: string;
  portion_size?: string;
  nutrition?: ProductNutrition[];
  additives?: string[];
}

export interface ThemePalette {
  background: string;
  surface: string;
  text: string;
  text_muted: string;
  primary: string;
  accent: string;
  border: string;
  header: string;
}

export interface ThemeAppearance {
  theme_color: {
    light: string;
    dark: string;
  };
  header_overlay: {
    light: number;
    dark: number;
  };
}

export interface ThemePresetMeta {
  id: string;
  name: string;
  description: string;
  swatch: string;
  swatch_accent?: string;
}

export interface SettingsData {
  restaurant_info: Record<string, string | number>;
  working_hours: Record<string, { is_open?: number | boolean; open_time?: string; close_time?: string }>;
  social_media: Record<string, string>;
  colors: {
    preset?: string;
    active_color?: string;
    accent_color?: string;
    light?: ThemePalette;
    dark?: ThemePalette;
    appearance?: ThemeAppearance;
  };
  theme_mode: { mode?: string };
  theme_presets?: ThemePresetMeta[];
  theme_preset_palettes?: Record<string, { light: ThemePalette; dark: ThemePalette }>;
  palette_keys?: string[];
  theme_editor_mode?: 'light' | 'dark';
  wifi: { ssid?: string; password?: string };
  information: { html_info?: string };
  slug: { slug?: string };
  languages: string[];
  default_language: string;
  default_currency: string;
  menu_url?: string;
  home_url?: string;
  recaptcha: {
    site_key: string;
    has_secret_key: boolean;
    secret_key?: string;
  };
  pro?: ProStatus;
  menu_display?: {
    default_view_mode?: 'list' | 'bento';
    list_style?: 'classic' | 'compact' | 'card';
    category_nav_mode?: 'tabs' | 'scroll';
    menu_entry_mode?: 'direct' | 'categories';
    header_style?: 'classic' | 'centered';
    stories_enabled?: '0' | '1';
  };
}

export interface ProFeatures {
  mcp: boolean;
  custom_design: boolean;
  stories: boolean;
  analytics?: boolean;
  dock?: boolean;
  menu_transfer?: boolean;
}

export interface ProStatus {
  is_pro: boolean;
  pro_installed?: boolean;
  pro_version?: string;
  checkout_url: string;
  license_key_masked?: string;
  status?: string;
  expires_at?: string;
  last_check?: number;
  features: ProFeatures;
}

export interface ReviewItem {
  id: number;
  service: number;
  taste: number;
  cleanliness: number;
  comment: string;
  language: string;
  customer_name: string;
  customer_email: string;
  created_at: string;
  is_read: string | number;
}

export interface ReviewsResponse {
  reviews: ReviewItem[];
  pagination: { page: number; per_page: number; total: number; total_pages: number };
  stats: {
    total: number;
    read: number;
    unread: number;
    avg_service: number;
    avg_taste: number;
    avg_cleanliness: number;
  };
}

