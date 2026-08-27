import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTranslation } from "../hooks/useTranslation"

interface SearchBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  currentLanguage: string
}

export const SearchBar = ({ searchQuery, onSearchChange, currentLanguage }: SearchBarProps) => {
  const { t } = useTranslation(currentLanguage)

  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        placeholder={t("menu.searchPlaceholder")}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10 pr-10"
      />
      {searchQuery ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
          onClick={() => onSearchChange("")}
        >
          <X className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  )
}
