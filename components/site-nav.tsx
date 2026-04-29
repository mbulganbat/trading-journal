"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, LineChart, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/accounts", label: "Accounts", icon: Wallet },
] as const

export function SiteNav() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg border border-border bg-card">
            <LineChart className="size-4 text-emerald-400" aria-hidden />
          </div>
          <span className="text-sm font-semibold tracking-tight">Trading Journal</span>
        </Link>
        <nav className="ml-2 flex items-center gap-1" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
