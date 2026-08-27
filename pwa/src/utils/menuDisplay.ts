import type { RestaurantSettings } from "@/types/menu"
import type { ViewMode } from "@/hooks/useViewMode"

export function resolveAdminViewMode(settings?: RestaurantSettings): ViewMode {
  const mode = settings?.defaultViewMode ?? (settings as { default_view_mode?: string })?.default_view_mode
  return mode === "bento" ? "bento" : "list"
}

export function resolveListStyle(
  settings?: RestaurantSettings,
): NonNullable<RestaurantSettings["listStyle"]> {
  const style = settings?.listStyle ?? (settings as { list_style?: string })?.list_style
  if (style === "compact" || style === "card") {
    return style
  }

  return "classic"
}

export type CategoryNavMode = "tabs" | "scroll"

export function resolveCategoryNavMode(settings?: RestaurantSettings): CategoryNavMode {
  const mode =
    settings?.categoryNavMode ??
    (settings as { category_nav_mode?: string })?.category_nav_mode

  return mode === "scroll" ? "scroll" : "tabs"
}

export type MenuEntryMode = "direct" | "categories"

export function resolveMenuEntryMode(settings?: RestaurantSettings): MenuEntryMode {
  const mode =
    settings?.menuEntryMode ??
    (settings as { menu_entry_mode?: string })?.menu_entry_mode

  return mode === "categories" ? "categories" : "direct"
}

export type HeaderStyle = "classic" | "centered"

export function resolveHeaderStyle(settings?: RestaurantSettings): HeaderStyle {
  const style = settings?.headerStyle ?? (settings as { header_style?: string })?.header_style

  return style === "centered" ? "centered" : "classic"
}

export function resolveStoriesEnabled(settings?: RestaurantSettings): boolean {
  if (!settings) return false

  if (typeof settings.storiesEnabled === "boolean") {
    return settings.storiesEnabled
  }

  const legacy = settings as { stories_enabled?: string | boolean }
  if (legacy.stories_enabled === true || legacy.stories_enabled === "1") {
    return true
  }

  return false
}
