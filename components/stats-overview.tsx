import { Calendar, Percent, TrendingUp, Wallet } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { type DayStats, formatCurrency } from "@/lib/trade-utils"

type Props = {
  dayMap: Map<string, DayStats>
}

export function StatsOverview({ dayMap }: Props) {
  let totalProfit = 0
  let totalTrades = 0
  let tradingDays = 0
  let winningDays = 0
  let bestDay = 0
  for (const stats of dayMap.values()) {
    totalProfit += stats.profit
    totalTrades += stats.tradeCount
    tradingDays += 1
    if (stats.profit > 0) winningDays += 1
    if (stats.profit > bestDay) bestDay = stats.profit
  }
  totalProfit = +totalProfit.toFixed(2)
  const winRate = tradingDays === 0 ? 0 : Math.round((winningDays / tradingDays) * 100)
  const avgPerDay = tradingDays === 0 ? 0 : +(totalProfit / tradingDays).toFixed(2)

  const items = [
    {
      label: "Net P/L",
      value: formatCurrency(totalProfit, { signed: true }),
      icon: Wallet,
      tone: totalProfit > 0 ? "win" : totalProfit < 0 ? "loss" : "neutral",
    },
    {
      label: "Win Rate",
      value: `${winRate}%`,
      icon: Percent,
      tone: "neutral" as const,
      sub: `${winningDays} of ${tradingDays} days`,
    },
    {
      label: "Avg / Day",
      value: formatCurrency(avgPerDay, { signed: true }),
      icon: TrendingUp,
      tone: avgPerDay > 0 ? "win" : avgPerDay < 0 ? "loss" : "neutral",
    },
    {
      label: "Trading Days",
      value: tradingDays.toString(),
      icon: Calendar,
      tone: "neutral" as const,
      sub: `${totalTrades} trades`,
    },
  ] as const

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon
        const valueColor =
          item.tone === "win" ? "text-emerald-400" : item.tone === "loss" ? "text-red-400" : "text-foreground"
        return (
          <Card key={item.label} className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-start justify-between gap-3 p-4">
              <div className="min-w-0 space-y-1">
                <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {item.label}
                </div>
                <div className={`text-2xl font-semibold tabular-nums ${valueColor}`}>{item.value}</div>
                {"sub" in item && item.sub ? (
                  <div className="text-xs text-muted-foreground">{item.sub}</div>
                ) : null}
              </div>
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40">
                <Icon className="size-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
