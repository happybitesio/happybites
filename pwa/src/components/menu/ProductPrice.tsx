import { getPriceDisplayParts } from "@/utils/menuHelpers"
import { cn } from "@/lib/utils"

interface Props {
  amount: number
  currency: string
  language: string
  size?: "sm" | "md" | "lg"
  className?: string
}

export function ProductPrice({ amount, currency, language, size = "md", className }: Props) {
  const parts = getPriceDisplayParts(amount, currency, language)
  const mainSize = size === "lg" ? "text-2xl" : size === "sm" ? "text-sm" : "text-lg"

  const amountNode = (
    <>
      <span>{parts.whole}</span>
      {parts.fraction ? (
        <>
          <span>{parts.decimalSeparator}</span>
          <span className="text-[0.78em] font-semibold tracking-normal opacity-70">{parts.fraction}</span>
        </>
      ) : null}
    </>
  )

  return (
    <span
      className={cn("inline-flex items-baseline gap-0.5 font-bold tabular-nums text-primary", mainSize, className)}
    >
      {parts.currencyIsPrefix ? (
        <>
          <span className="text-[0.78em] font-semibold opacity-70">{parts.currency}</span>
          {amountNode}
        </>
      ) : (
        <>
          {amountNode}
          <span className="ml-0.5 text-[0.78em] font-semibold opacity-70">{parts.currency}</span>
        </>
      )}
    </span>
  )
}
