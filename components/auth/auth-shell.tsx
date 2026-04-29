import Link from "next/link"
import type { ReactNode } from "react"
import { LineChart } from "lucide-react"

type Props = {
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
}

export function AuthShell({ title, description, children, footer }: Props) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="relative isolate flex min-h-screen flex-col">
        {/* Subtle radial accent */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_55%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.10),_transparent_50%)]"
        />

        <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg border border-border bg-card">
              <LineChart className="size-4 text-emerald-400" aria-hidden />
            </div>
            <span className="text-sm font-semibold tracking-tight">Trade Journal Insights</span>
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Back to home
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center px-4 pb-12 pt-4 sm:px-6">
          <div className="w-full max-w-md">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-semibold tracking-tight text-balance">{title}</h1>
              <p className="mt-1.5 text-sm text-muted-foreground text-pretty">{description}</p>
            </div>
            <div className="rounded-xl border border-border bg-card/60 p-5 shadow-sm backdrop-blur sm:p-6">
              {children}
            </div>
            <div className="mt-4 text-center text-sm text-muted-foreground">{footer}</div>
          </div>
        </div>
      </div>
    </main>
  )
}
