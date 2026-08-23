import { ReactNode } from "react"
import { X } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
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
  className?: string
  tall?: boolean
}

export function MenuBottomSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  tall = false,
}: MenuBottomSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        hideClose
        className={cn(
          "menu-sheet flex flex-col gap-0 rounded-t-[28px] border-0 p-0 shadow-2xl",
          tall ? "h-[min(94vh,920px)]" : "max-h-[88vh]",
          className,
        )}
      >
        <div className="flex shrink-0 flex-col items-center pt-3">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/25" />
        </div>

        <div className="flex shrink-0 items-center gap-3 px-5 pb-4 pt-2">
          <SheetHeader className="min-w-0 flex-1 space-y-1 p-0 text-left">
            <SheetTitle className="pr-1 text-lg font-semibold leading-snug">{title}</SheetTitle>
            {description ? <SheetDescription>{description}</SheetDescription> : null}
          </SheetHeader>
          <SheetClose className="menu-sheet__close flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-foreground opacity-100 transition-colors hover:bg-muted/80 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden">
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </SheetClose>
        </div>

        <ScrollArea className="min-h-0 flex-1 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {children}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

interface MenuDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  children: ReactNode
}

export function MenuDialog({ open, onOpenChange, title, description, children }: MenuDialogProps) {
  return (
    <MenuBottomSheet open={open} onOpenChange={onOpenChange} title={title} description={description}>
      {children}
    </MenuBottomSheet>
  )
}
