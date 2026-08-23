const STORAGE_KEY = "happybites-language"

export function resolveMenuLanguage(activeLanguages: string[], defaultLanguage: string): string {
  const languages = activeLanguages.filter(Boolean)
  if (languages.length === 0) return "en"

  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && languages.includes(stored)) {
    return stored
  }

  if (defaultLanguage && languages.includes(defaultLanguage)) {
    return defaultLanguage
  }

  return languages[0]
}

export function getStoredMenuLanguage(): string | null {
  return localStorage.getItem(STORAGE_KEY)
}

export function persistMenuLanguage(code: string): void {
  localStorage.setItem(STORAGE_KEY, code)
}

export function useInitialMenuLanguage(): string {
  return getStoredMenuLanguage() || "en"
}
