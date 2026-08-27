import { UtensilsCrossed } from "lucide-react"

interface Props {
  title: string
  description?: string
  className?: string
}

export function SectionHeading({ title, description, className }: Props) {
  return (
    <div className={className}>
      <div className="flex items-start gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <UtensilsCrossed className="h-3.5 w-3.5" />
        </span>
        <div className="flex flex-col gap-0">
          <h2 className="text-base font-bold tracking-tight text-foreground">{title}</h2>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
      </div>
    </div>
  )
}
