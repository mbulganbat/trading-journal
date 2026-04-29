"use client"

import Link from "next/link"
import { LineChart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-store-provider"

export function LandingNav() {
  const { isAuthenticated, isHydrated } = useAuth()

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg border border-border bg-card">
            <LineChart className="size-4 text-emerald-400" aria-hidden />
          </div>
          <span className="text-sm font-semibold tracking-tight">Trade Journal Insights</span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm md:flex" aria-label="Primary">
          <a
            href="#features"
            className="rounded-md px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          >
            Features
          </a>
          <a
            href="#pricing"
            className="rounded-md px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          >
            Pricing
          </a>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {isHydrated && isAuthenticated ? (
            <Button asChild size="sm" className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400">
              <Link href="/app">Open app</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="sm" className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400">
                <Link href="/sign-up">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
