import { resolveHeaderStyle } from "@/utils/menuDisplay"

import { MenuHeaderCentered } from "./headers/MenuHeaderCentered"
import { MenuHeaderClassic } from "./headers/MenuHeaderClassic"
import type { MenuHeaderProps } from "./headers/menuHeaderShared"

export type { MenuHeaderProps } from "./headers/menuHeaderShared"

export function MenuHeader(props: MenuHeaderProps) {
  const headerStyle = resolveHeaderStyle(props.settings)

  if (headerStyle === "centered") {
    return <MenuHeaderCentered {...props} />
  }

  return <MenuHeaderClassic {...props} />
}
