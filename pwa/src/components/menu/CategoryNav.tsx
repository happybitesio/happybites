import { useEffect, useRef } from "react"
import { ChevronLeft } from "lucide-react"
import { Category } from "@/types/menu"
import { cn } from "@/lib/utils"

interface Props {
  categories: Category[]
  activeCategory: string
  currentLanguage: string
  onCategorySelect: (slug: string) => void
  onAllCategoriesClick?: () => void
  allCategoriesLabel?: string
}

export function CategoryNav({
  categories,
  activeCategory,
  currentLanguage,
  onCategorySelect,
  onAllCategoriesClick,
  allCategoriesLabel = "All categories",
}: Props) {
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  useEffect(() => {
    const activeButton = buttonRefs.current[activeCategory]
    activeButton?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" })
  }, [activeCategory])

  return (
    <nav className="menu-category-bar" aria-label="Categories">
      <div className="menu-category-scroll flex gap-2 overflow-x-auto px-4 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {onAllCategoriesClick ? (
          <button
            type="button"
            onClick={onAllCategoriesClick}
            aria-label={allCategoriesLabel}
            title={allCategoriesLabel}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        ) : null}

        {categories.map((category) => {
          const active = activeCategory === category.slug
          const label = category.name[currentLanguage] || category.name.tr

          return (
            <button
              key={category.slug}
              ref={(node) => {
                buttonRefs.current[category.slug] = node
              }}
              type="button"
              onClick={() => onCategorySelect(category.slug)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
              )}
            >
              {label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
