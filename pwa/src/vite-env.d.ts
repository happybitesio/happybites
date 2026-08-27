/// <reference types="vite/client" />

import type { MenuData } from "./types/menu"

declare global {
  interface Window {
    /** Bridge for the HappyBites Pro stories island. */
    __HB_MENU_DATA__?: MenuData
    __HB_MENU_LANG__?: string
  }
}
