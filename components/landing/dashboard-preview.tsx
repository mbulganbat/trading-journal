import { ArrowDownRight, ArrowUpRight, BarChart3, Target, TrendingUp } from "lucide-react"

/**
 * A static, self-contained "screenshot" of the dashboard built from primitives so it
 * renders crisply at any size and matches the live app's color tokens. Not interactive.
 */
export function DashboardPreview() {
  return (
    <section className="border-b border-border/60">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Your trading edge, on one screen
          </h2>
          <p className="mt-3 text-pretty text-muted-foreground">
            Net P/L, win rate, trading days, calendar, and progress heatmap — all driven by one
            unified trade log.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-5xl">
          <div className="rounded-xl border border-border bg-card/70 p-3 shadow-2xl shadow-black/20 backdrop-blur sm:p-4">
            {/* Browser chrome */}
            <div className="flex items-center gap-1.5 px-2 pb-3">
              <span className="size-2.5 rounded-full bg-rose-500/70" aria-hidden />
              <span className="size-2.5 rounded-full bg-amber-400/70" aria-hidden />
              <span className="size-2.5 rounded-full bg-emerald-500/70" aria-hidden />
              <span className="ml-3 text-xs text-muted-foreground">app.tradejournalinsights.com</span>
            </div>

            <div className="rounded-lg border border-border bg-background p-4 sm:p-6">
              {/* Stat row */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatTile label="Net P/L" value="+$4,820" icon={TrendingUp} tone="emerald" delta="+12.4%" />
                <StatTile label="Win Rate" value="62%" icon={Target} tone="indigo" delta="42 trades" />
                <StatTile label="Best Day" value="+$980" icon={ArrowUpRight} tone="emerald" delta="Mar 18" />
                <StatTile label="Worst Day" value="-$420" icon={ArrowDownRight} tone="rose" delta="Mar 06" />
              </div>

              {/* Calendar mock */}
              <div className="mt-5 rounded-lg border border-border bg-card/60 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium">March 2026</p>
                  <span className="text-xs text-muted-foreground">P/L by day</span>
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {Array.from({ length: 35 }).map((_, i) => {
                    const tone = MOCK_CAL[i] ?? "neutral"
                    return (
                      <div
                        key={i}
                        className={`h-9 rounded-md border ${TONE_CLASSES[tone]} flex items-end justify-end p-1`}
                        aria-hidden
                      >
                        <span className="text-[9px] tabular-nums text-foreground/70">{i + 1 <= 31 ? i + 1 : ""}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Heatmap row */}
              <div className="mt-5 rounded-lg border border-border bg-card/60 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="size-4 text-emerald-400" aria-hidden />
                    <p className="text-sm font-medium">26-week progress</p>
                  </div>
                  <span className="text-xs text-muted-foreground">Profit intensity</span>
                </div>
                <div className="grid grid-flow-col grid-rows-7 gap-1">
                  {Array.from({ length: 26 * 7 }).map((_, i) => {
                    const level = MOCK_HEAT[i % MOCK_HEAT.length]
                    return <span key={i} className={`size-2.5 rounded-sm ${HEAT_CLASSES[level]}`} aria-hidden />
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

type Tone = "emerald" | "indigo" | "rose"
type LucideIcon = React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>

function StatTile({
  label,
  value,
  icon: Icon,
  tone,
  delta,
}: {
  label: string
  value: string
  icon: LucideIcon
  tone: Tone
  delta: string
}) {
  const toneText: Record<Tone, string> = {
    emerald: "text-emerald-300",
    indigo: "text-indigo-300",
    rose: "text-rose-300",
  }
  const toneBg: Record<Tone, string> = {
    emerald: "bg-emerald-500/10",
    indigo: "bg-indigo-500/10",
    rose: "bg-rose-500/10",
  }
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card/70 p-3">
      <div className={`flex size-8 items-center justify-center rounded-md ${toneBg[tone]}`}>
        <Icon className={`size-4 ${toneText[tone]}`} aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-base font-semibold">{value}</p>
        <p className="truncate text-[10px] text-muted-foreground">{delta}</p>
      </div>
    </div>
  )
}

// Mock palettes — purely visual, no real data.
const MOCK_CAL: Array<"win" | "loss" | "flat" | "neutral"> = [
  "neutral",
  "neutral",
  "neutral",
  "win",
  "win",
  "loss",
  "neutral",
  "win",
  "flat",
  "win",
  "win",
  "loss",
  "neutral",
  "neutral",
  "win",
  "win",
  "loss",
  "win",
  "win",
  "neutral",
  "neutral",
  "win",
  "loss",
  "win",
  "win",
  "win",
  "neutral",
  "neutral",
  "win",
  "flat",
  "win",
]

const TONE_CLASSES: Record<"win" | "loss" | "flat" | "neutral", string> = {
  win: "border-emerald-500/30 bg-emerald-500/15",
  loss: "border-rose-500/30 bg-rose-500/15",
  flat: "border-border bg-muted/40",
  neutral: "border-border bg-card",
}

const MOCK_HEAT: Array<0 | 1 | 2 | 3 | 4> = [
  0, 1, 0, 2, 1, 0, 0, 1, 2, 3, 2, 1, 0, 1, 2, 4, 3, 2, 1, 0, 1, 2, 3, 2, 1, 0, 1,
  2, 3, 4, 3, 2, 1, 0, 0, 1, 2, 1, 0, 1, 2, 3, 4, 3, 2, 1, 0, 1, 2, 1,
]

const HEAT_CLASSES: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "bg-card border border-border",
  1: "bg-emerald-500/15",
  2: "bg-emerald-500/30",
  3: "bg-emerald-500/55",
  4: "bg-emerald-500/80",
}
