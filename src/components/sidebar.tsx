"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Phone, Settings2, AudioWaveform } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Calls", href: "/calls", icon: Phone },
  { label: "System", href: "/system", icon: Settings2 },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-[180px] shrink-0 flex-col border-r border-border">
      <div className="flex h-12 items-center gap-2 px-4">
        <AudioWaveform className="h-4 w-4 text-primary" />
        <span className="text-[13px] font-semibold tracking-tight text-foreground">
          NEOD Echo
        </span>
      </div>

      <nav className="flex flex-col gap-0.5 px-3 py-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] transition-colors',
                isActive
                  ? 'bg-brand-50 font-medium text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto border-t border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-[11px] text-muted-foreground">Connected</span>
        </div>
      </div>
    </aside>
  )
}
