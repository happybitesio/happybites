export const PRODUCT_TAG_ICONS: Record<string, string> = {
  out_of_stock: "⛔",
  new_product: "✨",
  vegan: "🌱",
  vegetarian: "🥗",
  gluten_free: "🌾",
  organic: "🍃",
  spicy: "🌶️",
  popular: "🔥",
  seasonal: "🍂",
  chef_special: "👨‍🍳",
  halal: "☪️",
  kosher: "✡️",
  lactose_free: "🥛",
  low_calorie: "💚",
  low_sodium: "🧂",
  low_sugar: "🍬",
}

export function getProductTagIcon(tag: string): string | null {
  return PRODUCT_TAG_ICONS[tag] ?? null
}

export function productTagBadgeClass(tag: string): string {
  if (tag === "new_product") {
    return "border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300"
  }

  if (tag === "vegetarian" || tag === "vegan" || tag === "organic") {
    return "border-teal-200/80 bg-teal-50 text-teal-700 dark:border-teal-800/60 dark:bg-teal-950/40 dark:text-teal-300"
  }

  if (tag === "spicy") {
    return "border-red-200/80 bg-red-50 text-red-700 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-300"
  }

  if (tag === "chef_special" || tag === "popular" || tag === "seasonal") {
    return "border-orange-200/80 bg-orange-50 text-orange-700 dark:border-orange-800/60 dark:bg-orange-950/40 dark:text-orange-300"
  }

  return "border-border/70 bg-muted/60 text-foreground"
}
