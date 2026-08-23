import { useEffect, useState } from "react"

export type ViewMode = "list" | "bento"

const STORAGE_KEY = "happybites-view-mode"

export function useViewMode() {
  const [viewMode, setViewMode] = useState<ViewMode>("list")

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === "list" || stored === "bento") {
      setViewMode(stored)
    }
  }, [])

  const updateViewMode = (mode: ViewMode) => {
    setViewMode(mode)
    localStorage.setItem(STORAGE_KEY, mode)
  }

  return { viewMode, setViewMode: updateViewMode }
}
