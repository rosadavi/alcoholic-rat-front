"use client"

import { cn } from "@/lib/utils"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/mode-toggle"
interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  fixed?: boolean
}

export function Header({ className, fixed, ...props }: HeaderProps) {
  return (
    <header
      data-app-header
      className={cn(
        "h-16 shrink-0 border-b bg-background",
        fixed && "sticky top-0 z-10",
        className
      )}
      {...props}
    >
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex flex-1 items-center gap-3">
          <SidebarTrigger variant="outline" className="max-md:scale-125" />
        </div>

        <div className="flex items-center gap-3">
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
