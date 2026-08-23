import { Search, SlidersHorizontal, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Category } from "@/types/menu"
import { useTranslation } from "@/hooks/useTranslation"
import { ViewMode } from "@/hooks/useViewMode"
import { ViewModeToggle } from "./ViewModeToggle"
import { cn } from "@/lib/utils"

interface Props {
  searchQuery: string
  onSearchChange: (query: string) => void
  categories: Category[]
  activeCategory: string
  onCategorySelect: (slug: string) => void
  currentLanguage: string
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  filterCount: number
  onFilterClick: () => void
}

export function MenuToolbar({
  searchQuery,
  onSearchChange,
  categories,
  activeCategory,
  onCategorySelect,
  currentLanguage,
  viewMode,
  onViewModeChange,
  filterCount,
  onFilterClick,
}: Props) {
  const { t } = useTranslation(currentLanguage)

  return (
    <div className="menu-toolbar sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-xl">
      <div className="space-y-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t("menu.searchPlaceholder")}
              className="h-11 rounded-2xl border-transparent bg-muted/80 pl-10 pr-10 shadow-none focus-visible:border-primary/30 focus-visible:ring-primary/20"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-muted text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={onFilterClick}
            className="relative h-11 w-11 shrink-0 rounded-2xl border-border/60 bg-card"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {filterCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {filterCount}
              </span>
            ) : null}
          </Button>

          <ViewModeToggle
            value={viewMode}
            onChange={onViewModeChange}
            listLabel={t("menu.viewList")}
            bentoLabel={t("menu.viewBento")}
          />
        </div>

        <div className="menu-category-scroll -mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((category) => {
            const active = activeCategory === category.slug
            const label = category.name[currentLanguage] || category.name.tr

            return (
              <button
                key={category.slug}
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
      </div>
    </div>
  )
}
