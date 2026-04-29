"use client"

import { useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/components/auth-store-provider"

/**
 * Wraps protected pages. Redirects to /login when no session is present.
 * Renders a lightweight loading state until hydration completes.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isHydrated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace("/login")
    }
  }, [isHydrated, isAuthenticated, router])

  if (!isHydrated || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="size-5 animate-spin" aria-hidden />
        <span className="sr-only">Loading…</span>
      </div>
    )
  }

  return <>{children}</>
}

/**
 * Inverse guard for /login and /sign-up. Redirects authenticated users to /app.
 */
export function GuestGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isHydrated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      router.replace("/app")
    }
  }, [isHydrated, isAuthenticated, router])

  if (!isHydrated || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="size-5 animate-spin" aria-hidden />
        <span className="sr-only">Loading…</span>
      </div>
    )
  }

  return <>{children}</>
}
