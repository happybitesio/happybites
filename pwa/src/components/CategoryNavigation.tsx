import { Button } from "@/components/ui/button"
import { Category } from "../types/menu"

interface CategoryNavigationProps {
  categories: Category[]
  activeCategory: string
  onCategorySelect: (slug: string) => void
  currentLanguage: string
}

export const CategoryNavigation = ({
  categories,
  activeCategory,
  onCategorySelect,
  currentLanguage,
}: CategoryNavigationProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {categories.map((category) => (
        <Button
          key={category.slug}
          variant={activeCategory === category.slug ? "default" : "outline"}
          size="sm"
          onClick={() => onCategorySelect(category.slug)}
          className="shrink-0 whitespace-nowrap"
        >
          {category.name[currentLanguage] || category.name.tr}
        </Button>
      ))}
    </div>
  )
}
