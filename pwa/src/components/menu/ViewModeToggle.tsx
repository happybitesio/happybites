import { LayoutGrid, List } from "lucide-react"
import { ViewMode } from "@/hooks/useViewMode"
import { cn } from "@/lib/utils"

interface Props {
  value: ViewMode
  onChange: (mode: ViewMode) => void
  listLabel: string
  bentoLabel: string
}

export function ViewModeToggle({ value, onChange, listLabel, bentoLabel }: Props) {
  return (
    <div className="menu-view-toggle flex h-11 shrink-0 items-center rounded-2xl border border-border/60 bg-card p-1">
      <button
        type="button"
        aria-label={listLabel}
        aria-pressed={value === "list"}
        onClick={() => onChange("list")}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-xl transition-all",
          value === "list" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <List className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label={bentoLabel}
        aria-pressed={value === "bento"}
        onClick={() => onChange("bento")}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-xl transition-all",
          value === "bento" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
    </div>
  )
}
