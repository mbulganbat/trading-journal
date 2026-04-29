import Link from "next/link"
import { LineChart } from "lucide-react"

export function LandingFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg border border-border bg-card">
            <LineChart className="size-3.5 text-emerald-400" aria-hidden />
          </div>
          <span className="text-sm font-semibold tracking-tight">Trade Journal Insights</span>
        </Link>
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Trade Journal Insights. Built for serious traders.
        </p>
      </div>
    </footer>
  )
}
