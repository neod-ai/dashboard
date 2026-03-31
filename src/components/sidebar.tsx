"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
  { label: "Overview", href: "/" },
  { label: "Calls", href: "/calls" },
  { label: "System", href: "/system" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-[180px] shrink-0 flex-col border-r border-border">
      <div className="flex h-12 items-center px-5">
        <span className="text-[13px] font-semibold tracking-tight text-foreground">
          NEOD Echo
        </span>
      </div>

      <nav className="flex flex-col px-3 py-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center rounded px-2 py-1.5 text-[13px] transition-colors ${
                isActive
                  ? "font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
