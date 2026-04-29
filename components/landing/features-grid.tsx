import {
  BookOpen,
  CalendarRange,
  CheckSquare,
  FileSpreadsheet,
  ShieldCheck,
  Target,
  Wallet,
} from "lucide-react"

const FEATURES = [
  {
    icon: BookOpen,
    title: "Add Journal",
    description:
      "Log every trade with symbol, direction, entry, SL/TP, lot size, screenshots, mistakes, and notes — all in one place.",
    accent: "emerald",
  },
  {
    icon: CalendarRange,
    title: "Calendar & Progress",
    description:
      "See P/L per day on a clean monthly grid plus a 26-week progress heatmap to spot consistency at a glance.",
    accent: "indigo",
  },
  {
    icon: Wallet,
    title: "Account Tracking",
    description:
      "Manage Demo, Challenge, Funded, and Live accounts. Auto-update balances from closed P/L, or set manually.",
    accent: "emerald",
  },
  {
    icon: FileSpreadsheet,
    title: "Import Trades",
    description:
      "Bring in trade history from your broker or platform — get up and running without re-typing weeks of work.",
    accent: "indigo",
  },
  {
    icon: CheckSquare,
    title: "Checklist Discipline",
    description:
      "Define per-setup checklists (ICT/SMC/PA). Score every entry as Weak, Average, Good, or A+ before you click buy.",
    accent: "emerald",
  },
  {
    icon: Target,
    title: "Prop Firm Analytics",
    description:
      "Daily drawdown awareness, RR consistency, and win-rate by session — built around the rules that matter.",
    accent: "indigo",
  },
] as const

export function FeaturesGrid() {
  return (
    <section id="features" className="border-b border-border/60">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Everything a serious trader needs
          </h2>
          <p className="mt-3 text-pretty text-muted-foreground">
            Six tools that turn raw trades into an honest, repeatable process.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = f.icon
            const accentBg = f.accent === "emerald" ? "bg-emerald-500/10" : "bg-indigo-500/10"
            const accentText = f.accent === "emerald" ? "text-emerald-300" : "text-indigo-300"
            return (
              <article
                key={f.title}
                className="group rounded-xl border border-border bg-card/60 p-5 transition-colors hover:border-border/80 hover:bg-card/80"
              >
                <div
                  className={`mb-4 flex size-10 items-center justify-center rounded-lg ${accentBg}`}
                  aria-hidden
                >
                  <Icon className={`size-5 ${accentText}`} aria-hidden />
                </div>
                <h3 className="text-base font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
              </article>
            )
          })}
        </div>

        <div className="mt-10 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-4 text-emerald-400" aria-hidden />
          Local-first MVP. Your trades stay on your device while we build out cloud sync.
        </div>
      </div>
    </section>
  )
}
