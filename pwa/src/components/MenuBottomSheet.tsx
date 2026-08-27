import { ReactNode } from "react"
import { X } from "lucide-react"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

interface MenuBottomSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  flushMedia?: ReactNode
  className?: string
  tall?: boolean
}
export function MenuBottomSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  flushMedia,
  className,
  tall = false,
}: MenuBottomSheetProps) {  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        hideClose
        className={cn(
          "menu-sheet flex flex-col gap-0 rounded-t-[28px] border-0 p-0 shadow-2xl",
          tall ? "h-[min(94dvh,920px)]" : "h-[min(88dvh,88vh)]",
          className,
        )}      >
        <div className="flex shrink-0 flex-col items-center pt-3">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/25" />
        </div>

        <div className="flex shrink-0 items-center gap-3 px-5 pb-4 pt-2">
          <SheetHeader className="min-w-0 flex-1 space-y-1 p-0 text-left">
            <SheetTitle className="pr-1 text-lg font-semibold leading-snug">{title}</SheetTitle>
            {description ? <SheetDescription>{description}</SheetDescription> : null}
          </SheetHeader>
          <SheetClose className="menu-sheet__close flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-foreground opacity-100 transition-colors hover:bg-muted/80 outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0">
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </SheetClose>
        </div>

        {flushMedia ? <div className="shrink-0">{flushMedia}</div> : null}

        <div className="menu-sheet__body min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4 [-webkit-overflow-scrolling:touch]">
          {children}
        </div>

        {footer ? (
          <div className="menu-sheet__footer shrink-0 border-t border-border/60 bg-background px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
            {footer}
          </div>
        ) : (
          <div className="shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]" aria-hidden />
        )}      </SheetContent>
    </Sheet>
  )
}

interface MenuDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  tall?: boolean
}

export function MenuDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  tall,
}: MenuDialogProps) {
  return (
    <MenuBottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      footer={footer}
      tall={tall}
    >
      {children}
    </MenuBottomSheet>
  )
}