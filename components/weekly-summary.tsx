import { formatCurrency, type WeekSummary } from "@/lib/trade-utils"

type Props = {
  weeks: WeekSummary[]
  monthIndex: number
}

export function WeeklySummary({ weeks }: Props) {
  return (
    <aside className="flex flex-col gap-2">
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Weekly Summary</div>
      <ul className="flex flex-col gap-1.5">
        {weeks.map((week, idx) => {
          const tone =
            week.profit > 0
              ? "border-emerald-500/30 bg-emerald-500/5"
              : week.profit < 0
                ? "border-red-500/30 bg-red-500/5"
                : "border-border bg-card"
          const valueTone =
            week.profit > 0 ? "text-emerald-400" : week.profit < 0 ? "text-red-400" : "text-muted-foreground"

          return (
            <li
              key={idx}
              className={`rounded-lg border px-3 py-2.5 transition-colors ${tone} ${
                week.tradingDays === 0 ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">Week {idx + 1}</span>
                <span className={`text-sm font-semibold tabular-nums ${valueTone}`}>
                  {formatCurrency(week.profit, { signed: true })}
                </span>
              </div>
              <div className="mt-0.5 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>
                  {week.tradingDays} {week.tradingDays === 1 ? "day" : "days"}
                </span>
                <span>
                  {week.tradeCount} {week.tradeCount === 1 ? "trade" : "trades"}
                </span>
              </div>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
