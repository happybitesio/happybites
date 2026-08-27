import { Button } from "@/components/ui/button"
import { SpiceLevel } from "@/components/SpiceLevel"
import { useTranslation } from "@/hooks/useTranslation"
import { MenuBottomSheet } from "../MenuBottomSheet"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedTags: string[]
  selectedSpiceLevel: number | null
  availableTags: string[]
  currentLanguage: string
  onToggleTag: (tag: string) => void
  onSetSpiceFilter: (level: number | null) => void
  onClearFilters: () => void
}

export function FilterSheet({
  open,
  onOpenChange,
  selectedTags,
  selectedSpiceLevel,
  availableTags,
  currentLanguage,
  onToggleTag,
  onSetSpiceFilter,
  onClearFilters,
}: Props) {
  const { t } = useTranslation(currentLanguage)
  const activeCount = selectedTags.length + (selectedSpiceLevel !== null ? 1 : 0)

  return (
    <MenuBottomSheet open={open} onOpenChange={onOpenChange} title={t("filters.title")}>
      <div className="space-y-6 pb-2">
        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("filters.tags")}
          </h3>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => {
              const active = selectedTags.includes(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onToggleTag(tag)}
                  className={`rounded-full px-3.5 py-2 text-sm font-medium transition-all ${
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t(`tags.${tag}`)}
                </button>
              )
            })}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("filters.spiceLevel")}
            </h3>
            {selectedSpiceLevel !== null ? (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onSetSpiceFilter(null)}>
                {t("common.clear")}
              </Button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onSetSpiceFilter(null)}
              className={`rounded-full px-3.5 py-2 text-sm font-medium ${
                selectedSpiceLevel === null
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {t("common.all")}
            </button>
            {[1, 2, 3].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => onSetSpiceFilter(level)}
                className={`inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-medium ${
                  selectedSpiceLevel === level
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <SpiceLevel level={level} size="sm" />
              </button>
            ))}
          </div>
        </section>

        {activeCount > 0 ? (
          <Button variant="outline" className="w-full rounded-2xl" onClick={onClearFilters}>
            {t("filters.clearAll")}
          </Button>
        ) : null}
      </div>
    </MenuBottomSheet>
  )
}
