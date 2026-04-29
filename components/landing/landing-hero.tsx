import Link from "next/link"
import { ArrowRight, PlayCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function LandingHero() {
  return (
    <section className="relative isolate overflow-hidden border-b border-border/60">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(99,102,241,0.18),transparent_70%),radial-gradient(40%_40%_at_85%_30%,rgba(16,185,129,0.10),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent"
      />

      <div className="mx-auto flex max-w-6xl flex-col items-center px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-20 lg:pt-24">
        <Badge
          variant="outline"
          className="mb-5 border-indigo-400/30 bg-indigo-500/10 text-xs font-medium text-indigo-200"
        >
          For SMC, ICT &amp; prop firm traders
        </Badge>

        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
          Build discipline. Track every setup.{" "}
          <span className="bg-gradient-to-r from-indigo-300 via-emerald-300 to-emerald-200 bg-clip-text text-transparent">
            Improve every trade.
          </span>
        </h1>

        <p className="mt-5 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
          A trading journal built for SMC, ICT, price action, and prop firm traders. Log trades with
          full context, calculate risk in real-time, and see your edge form on a calendar.
        </p>

        <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
          >
            <Link href="/sign-up">
              Get Started
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-border bg-card/60">
            <Link href="/app">
              <PlayCircle className="size-4" aria-hidden />
              View Demo
            </Link>
          </Button>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          No credit card required. Free during beta.
        </p>
      </div>
    </section>
  )
}
