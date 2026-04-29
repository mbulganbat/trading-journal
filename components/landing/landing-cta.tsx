import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function LandingCTA() {
  return (
    <section id="pricing" className="border-b border-border/60">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card/60 px-6 py-10 sm:px-10 sm:py-14">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_70%_at_50%_50%,rgba(99,102,241,0.18),transparent_70%),radial-gradient(40%_50%_at_85%_30%,rgba(16,185,129,0.10),transparent_70%)]"
          />
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Free during beta
            </h2>
            <p className="mt-3 text-pretty text-muted-foreground">
              Sign up now and lock in early-access pricing. No credit card required to get started.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400">
                <Link href="/sign-up">
                  Create free account
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-border bg-card/60">
                <Link href="/app">Try the demo first</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
