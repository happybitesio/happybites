import { useEffect, useState } from "react"

export type ViewMode = "list" | "bento"

const LEGACY_STORAGE_KEY = "happybites-view-mode"
const OVERRIDE_STORAGE_KEY = "happybites-view-mode-override"
const ADMIN_DEFAULT_STORAGE_KEY = "happybites-admin-view-mode"

function resolveViewMode(adminDefault: ViewMode): ViewMode {
  if (typeof window === "undefined") {
    return adminDefault
  }

  const previousAdminDefault = localStorage.getItem(ADMIN_DEFAULT_STORAGE_KEY)

  if (previousAdminDefault !== adminDefault) {
    localStorage.setItem(ADMIN_DEFAULT_STORAGE_KEY, adminDefault)
    localStorage.removeItem(OVERRIDE_STORAGE_KEY)
    localStorage.removeItem(LEGACY_STORAGE_KEY)
  }

  const override =
    localStorage.getItem(OVERRIDE_STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY)

  if (override === "list" || override === "bento") {
    return override
  }

  return adminDefault
}

export function useViewMode(adminDefault: ViewMode = "list") {
  const [viewMode, setViewModeState] = useState<ViewMode>(() => resolveViewMode(adminDefault))

  useEffect(() => {
    setViewModeState(resolveViewMode(adminDefault))
  }, [adminDefault])

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode)
    localStorage.setItem(OVERRIDE_STORAGE_KEY, mode)
    localStorage.removeItem(LEGACY_STORAGE_KEY)
  }

  return { viewMode, setViewMode }
}
