"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, LineChart, LogOut, User, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth-store-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const NAV_ITEMS = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/accounts", label: "Accounts", icon: Wallet },
] as const

export function SiteNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    router.replace("/login")
  }

  const initial = (user?.name?.[0] ?? user?.email?.[0] ?? "U").toUpperCase()

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link href="/app" className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg border border-border bg-card">
            <LineChart className="size-4 text-emerald-400" aria-hidden />
          </div>
          <span className="text-sm font-semibold tracking-tight">Trade Journal Insights</span>
        </Link>
        <nav className="ml-2 flex items-center gap-1" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = item.href === "/app" ? pathname === "/app" : pathname?.startsWith(item.href)
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

        {user ? (
          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-border bg-card pl-2 pr-2.5"
                  aria-label="Account menu"
                >
                  <span className="flex size-6 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-semibold text-emerald-300">
                    {initial}
                  </span>
                  <span className="max-w-[120px] truncate text-sm">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                  <span className="text-sm">{user.name}</span>
                  <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                  <User className="size-4" aria-hidden />
                  Profile (coming soon)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleLogout} className="text-rose-300 focus:text-rose-200">
                  <LogOut className="size-4" aria-hidden />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null}
      </div>
    </header>
  )
}
