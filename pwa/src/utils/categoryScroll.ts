import { useCallback, useEffect, useRef } from "react"
import { writeMenuDeepLink } from "@/utils/menuHelpers"

export const CATEGORY_NAV_OFFSET = 52

export function getCategorySectionId(slug: string): string {
  return `category-${slug}`
}

export function scrollToCategorySection(slug: string, offset = CATEGORY_NAV_OFFSET): void {
  const element = document.getElementById(getCategorySectionId(slug))
  if (!element) return

  const top = element.getBoundingClientRect().top + window.scrollY - offset
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" })
}

interface ScrollSpyOptions {
  enabled: boolean
  slugs: string[]
  activeCategory: string
  onActiveChange: (slug: string) => void
  offset?: number
}

export function useCategoryScrollSpy({
  enabled,
  slugs,
  activeCategory,
  onActiveChange,
  offset = CATEGORY_NAV_OFFSET,
}: ScrollSpyOptions) {
  const lockedRef = useRef(false)
  const lockTimerRef = useRef<number | null>(null)
  const userScrolledRef = useRef(false)

  const scrollToCategory = useCallback(
    (slug: string) => {
      lockedRef.current = true
      userScrolledRef.current = true
      if (lockTimerRef.current !== null) {
        window.clearTimeout(lockTimerRef.current)
      }

      onActiveChange(slug)
      writeMenuDeepLink({ categorySlug: slug })
      scrollToCategorySection(slug, offset)

      lockTimerRef.current = window.setTimeout(() => {
        lockedRef.current = false
      }, 900)
    },
    [offset, onActiveChange],
  )

  useEffect(() => {
    if (!enabled || slugs.length === 0) return

    const resolveActiveSlug = (updateUrl: boolean) => {
      if (lockedRef.current) return

      let current = slugs[0]
      for (const slug of slugs) {
        const element = document.getElementById(getCategorySectionId(slug))
        if (!element) continue

        const top = element.getBoundingClientRect().top
        if (top <= offset + 12) {
          current = slug
        }
      }

      if (current && current !== activeCategory) {
        onActiveChange(current)
        if (updateUrl && userScrolledRef.current) {
          writeMenuDeepLink({ categorySlug: current })
        }
      }
    }

    const handleScroll = () => {
      userScrolledRef.current = true
      resolveActiveSlug(true)
    }

    resolveActiveSlug(false)
    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("resize", handleScroll)

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleScroll)
    }
  }, [enabled, slugs, activeCategory, offset, onActiveChange])

  useEffect(() => {
    return () => {
      if (lockTimerRef.current !== null) {
        window.clearTimeout(lockTimerRef.current)
      }
    }
  }, [])

  return { scrollToCategory }
}
