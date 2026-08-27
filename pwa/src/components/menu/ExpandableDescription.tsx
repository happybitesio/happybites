import { useLayoutEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

import { getMenuHeaderStyles, useMenuHeaderChrome } from "@/components/menu/headers/menuHeaderChrome"

interface Props {
  text: string
  moreLabel: string
  className?: string
}

export function ExpandableDescription({ text, moreLabel, className }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [isTruncated, setIsTruncated] = useState(false)
  const textRef = useRef<HTMLParagraphElement>(null)
  const { tone } = useMenuHeaderChrome()
  const styles = getMenuHeaderStyles(tone)

  useLayoutEffect(() => {
    if (expanded) return

    const element = textRef.current
    if (!element) return

    const checkTruncation = () => {
      setIsTruncated(element.scrollHeight > element.clientHeight + 1)
    }

    checkTruncation()

    const observer = new ResizeObserver(checkTruncation)
    observer.observe(element)

    return () => observer.disconnect()
  }, [text, expanded])

  return (
    <div className={cn("mb-3", className)}>
      <p
        ref={textRef}
        className={cn(
          "text-sm leading-tight",
          styles.body,
          !expanded && "line-clamp-2",
          !expanded &&
            isTruncated &&
            "[mask-image:linear-gradient(to_bottom,black_calc(100%-1.5rem),transparent)] [-webkit-mask-image:linear-gradient(to_bottom,black_calc(100%-1.5rem),transparent)]",
        )}
      >
        {text}
      </p>

      {!expanded && isTruncated ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className={cn("mt-1 text-xs font-semibold underline-offset-2 transition-colors hover:underline", styles.moreButton)}
        >
          {moreLabel}
        </button>
      ) : null}
    </div>
  )
}
