import { Category } from "@/types/menu"
import withBasePath from "@/utils/basePath"
import { cn } from "@/lib/utils"

interface Props {
  categories: Category[]
  currentLanguage: string
  onSelect: (slug: string) => void
  className?: string
}

function getCategoryTitle(category: Category, currentLanguage: string): string {
  return category.name[currentLanguage] || category.name.tr || ""
}

function getCategoryImageUrl(category: Category): string {
  return category.image?.url ? withBasePath(category.image.url) : withBasePath("/placeholder.svg")
}

export function CategoryGrid({ categories, currentLanguage, onSelect, className }: Props) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 px-3", className)}>
      {categories.map((category) => {
        const title = getCategoryTitle(category, currentLanguage)

        return (
          <button
            key={category.slug}
            type="button"
            onClick={() => onSelect(category.slug)}
            className="group overflow-hidden rounded-2xl bg-card text-left shadow-sm ring-1 ring-border/50 transition-transform active:scale-[0.98]"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-muted">
              <img
                src={getCategoryImageUrl(category)}
                alt={category.image?.alt || title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3">
                <p className="line-clamp-2 text-sm font-semibold leading-snug text-white">{title}</p>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
