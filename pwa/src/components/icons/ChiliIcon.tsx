import { cn } from "@/lib/utils"

interface ChiliIconProps extends React.SVGProps<SVGSVGElement> {
  active?: boolean
  tone?: "default" | "overlay"
}

const ACTIVE = { body: "#EF4444", stripe: "#C81E1E", stem: "#166534" }
const INACTIVE_DEFAULT = { body: "#D1D5DB", stripe: "#9CA3AF", stem: "#9CA3AF" }
const INACTIVE_OVERLAY = {
  body: "rgba(255,255,255,0.28)",
  stripe: "rgba(255,255,255,0.18)",
  stem: "rgba(255,255,255,0.28)",
}

export function ChiliIcon({
  active = true,
  tone = "default",
  className,
  ...props
}: ChiliIconProps) {
  const colors = active
    ? ACTIVE
    : tone === "overlay"
      ? INACTIVE_OVERLAY
      : INACTIVE_DEFAULT

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden
      {...props}
    >
      <path
        d="M15.4 3.6c.9-.5 2-.1 2.5.8.3.6 0 1.3-.6 1.6l-1.4.6c1.5.7 2.8 2.3 3.1 4.6.4 3.4-1.5 7.1-4 9.4-2 1.8-4.5 2.3-6.3 1.1-2-1.4-1.9-4.4-.2-7.1 1.3-2.1 3.1-3.9 5-4.9.4-1.5 1-2.9 1.9-4.1z"
        fill={colors.body}
      />
      <path
        d="M12.2 12.8c1 1.8 2.1 3.2 3.2 4-.5-1.2-.9-2.5-1.3-3.7-.4-1.3-.8-2.5-1.1-3.4.5.9 1 1.9 1.6 3.1z"
        fill={colors.stripe}
        opacity={active ? 0.9 : 1}
      />
      <path
        d="M16.2 3.2c.8-.4 1.8-.1 2.2.6.3.6 0 1.3-.6 1.5l-1.3.5c-.3-.7-.8-1.3-1.3-1.8.4.1.8.1 1 .2z"
        fill={colors.stem}
      />
    </svg>
  )
}
