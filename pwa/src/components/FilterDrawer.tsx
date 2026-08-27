import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { Filter } from "lucide-react"
import { SpiceLevel } from "@/components/SpiceLevel"
import { useTranslation } from "../hooks/useTranslation"

interface FilterDrawerProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  selectedTags: string[]
  selectedSpiceLevel: number | null
  availableTags: string[]
  currentLanguage: string
  onToggleTag: (tag: string) => void
  onSetSpiceFilter: (level: number | null) => void
  onClearFilters: () => void
}

export const FilterDrawer = ({
  isOpen,
  onOpenChange,
  selectedTags,
  selectedSpiceLevel,
  availableTags,
  currentLanguage,
  onToggleTag,
  onSetSpiceFilter,
  onClearFilters,
}: FilterDrawerProps) => {
  const { t } = useTranslation(currentLanguage)
  const activeFiltersCount = selectedTags.length + (selectedSpiceLevel !== null ? 1 : 0)

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          {t("common.filter")}
          {activeFiltersCount > 0 ? (
            <Badge className="ml-1 px-1.5 py-0.5 text-xs">{activeFiltersCount}</Badge>
          ) : null}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="rounded-t-2xl">
        <DrawerHeader className="text-left">
          <DrawerTitle>{t("filters.title")}</DrawerTitle>
        </DrawerHeader>
        <div className="space-y-6 px-4 pb-8">
          <div>
            <p className="mb-3 text-sm font-medium">{t("filters.tags")}</p>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <Button
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  size="sm"
                  onClick={() => onToggleTag(tag)}
                  className="text-xs"
                >
                  {t(`tags.${tag}`)}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium">{t("filters.spiceLevel")}</p>
              {selectedSpiceLevel !== null ? (
                <Button variant="ghost" size="sm" onClick={() => onSetSpiceFilter(null)} className="text-xs">
                  {t("common.clear")}
                </Button>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedSpiceLevel === null ? "default" : "outline"}
                size="sm"
                onClick={() => onSetSpiceFilter(null)}
                className="text-xs"
              >
                {t("common.all")}
              </Button>
              {[1, 2, 3].map((level) => (
                <Button
                  key={level}
                  variant={selectedSpiceLevel === level ? "default" : "outline"}
                  size="sm"
                  onClick={() => onSetSpiceFilter(level)}
                  className="gap-1 text-xs"
                >
                  <SpiceLevel level={level} size="sm" />
                </Button>
              ))}
            </div>
          </div>

          {activeFiltersCount > 0 ? (
            <div className="border-t pt-4">
              <Button variant="outline" onClick={onClearFilters} className="w-full">
                {t("filters.clearAll")}
              </Button>
            </div>
          ) : null}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
