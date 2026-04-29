"use client"

import { useMemo, useState } from "react"
import { Activity, DollarSign } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  buildHeatmapWeeks,
  type DayStats,
  formatCurrency,
  isSameDay,
  toDateKey,
} from "@/lib/trade-utils"

type Mode = "profit" | "activity"

type Props = {
  dayMap: Map<string, DayStats>
  weeks?: number
}

const WEEK_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""]

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
})

export function TradeHeatmap({ dayMap, weeks = 26 }: Props) {
  const [mode, setMode] = useState<Mode>("profit")
  const today = useMemo(() => {
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    return t
  }, [])

  const cols = useMemo(() => buildHeatmapWeeks(today, weeks), [today, weeks])

  const { maxProfit, maxLoss, maxTrades, totals } = useMemo(() => {
    let maxProfit = 0
    let maxLoss = 0
    let maxTrades = 0
    let totalProfit = 0
    let totalTrades = 0
    let tradingDays = 0
    let winningDays = 0

    for (const col of cols) {
      for (const date of col) {
        if (date.getTime() > today.getTime()) continue
        const stats = dayMap.get(toDateKey(date))
        if (!stats) continue
        if (stats.profit > maxProfit) maxProfit = stats.profit
        if (stats.profit < maxLoss) maxLoss = stats.profit
        if (stats.tradeCount > maxTrades) maxTrades = stats.tradeCount
        totalProfit += stats.profit
        totalTrades += stats.tradeCount
        tradingDays += 1
        if (stats.profit > 0) winningDays += 1
      }
    }
    return {
      maxProfit,
      maxLoss,
      maxTrades,
      totals: {
        totalProfit: +totalProfit.toFixed(2),
        totalTrades,
        tradingDays,
        winRate: tradingDays === 0 ? 0 : Math.round((winningDays / tradingDays) * 100),
      },
    }
  }, [cols, dayMap, today])

  // Month labels — show the month name once at the column where its 1st falls.
  const monthLabels = useMemo(() => {
    const labels: { col: number; label: string }[] = []
    const fmt = new Intl.DateTimeFormat("en-US", { month: "short" })
    let lastMonth = -1
    cols.forEach((col, i) => {
      for (const date of col) {
        if (date.getMonth() !== lastMonth) {
          // Only push when we cross into a new month and the date is at start of that month
          if (date.getDate() <= 7) {
            labels.push({ col: i, label: fmt.format(date) })
          }
          lastMonth = date.getMonth()
          break
        }
      }
    })
    // De-dupe consecutive same labels
    return labels.filter((l, i) => i === 0 || l.label !== labels[i - 1].label)
  }, [cols])

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-xl font-semibold">Progress Tracker</CardTitle>
          <CardDescription>
            {totals.tradingDays} trading days • {totals.totalTrades} trades •{" "}
            <span
              className={
                totals.totalProfit > 0
                  ? "font-medium text-emerald-400"
                  : totals.totalProfit < 0
                    ? "font-medium text-red-400"
                    : ""
              }
            >
              {formatCurrency(totals.totalProfit, { signed: true })}
            </span>{" "}
            • {totals.winRate}% win rate
          </CardDescription>
        </div>
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(v) => v && setMode(v as Mode)}
          variant="outline"
          size="sm"
          aria-label="Heatmap mode"
        >
          <ToggleGroupItem value="profit" aria-label="Profit heatmap">
            <DollarSign className="mr-1.5 size-3.5" />
            Profit
          </ToggleGroupItem>
          <ToggleGroupItem value="activity" aria-label="Activity heatmap">
            <Activity className="mr-1.5 size-3.5" />
            Activity
          </ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>

      <CardContent className="overflow-x-auto p-4 sm:p-6">
        <TooltipProvider delayDuration={50}>
          <div className="min-w-fit">
            {/* Month labels */}
            <div className="ml-7 mb-1 flex">
              {cols.map((_, i) => {
                const label = monthLabels.find((l) => l.col === i)
                return (
                  <div key={i} className="w-[14px] shrink-0 text-[10px] text-muted-foreground sm:w-[16px]">
                    {label?.label ?? ""}
                  </div>
                )
              })}
            </div>

            <div className="flex gap-2">
              {/* Weekday labels */}
              <div className="flex w-5 flex-col gap-[3px] pt-px">
                {WEEK_LABELS.map((d, i) => (
                  <div key={i} className="h-[11px] text-[10px] leading-[11px] text-muted-foreground sm:h-[13px]">
                    {d}
                  </div>
                ))}
              </div>

              {/* Cells */}
              <div className="flex gap-[3px]">
                {cols.map((col, cIdx) => (
                  <div key={cIdx} className="flex flex-col gap-[3px]">
                    {col.map((date, rIdx) => {
                      const inFuture = date.getTime() > today.getTime()
                      const stats = dayMap.get(toDateKey(date))
                      const tone = getCellTone(mode, stats, { maxProfit, maxLoss, maxTrades })
                      const isToday = isSameDay(date, today)

                      const cell = (
                        <div
                          className={`size-[11px] rounded-[3px] border border-border/50 transition-all duration-150 hover:scale-110 hover:ring-1 hover:ring-foreground/40 sm:size-[13px] ${
                            tone.className
                          } ${inFuture ? "opacity-0" : ""} ${isToday ? "ring-1 ring-foreground/60" : ""}`}
                          aria-hidden={inFuture}
                        />
                      )

                      if (inFuture) return <div key={rIdx}>{cell}</div>

                      return (
                        <Tooltip key={rIdx}>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="cursor-default"
                              aria-label={`${dateFormatter.format(date)}: ${
                                stats
                                  ? `${formatCurrency(stats.profit, { signed: true })}, ${stats.tradeCount} trades`
                                  : "no trades"
                              }`}
                            >
                              {cell}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            <div className="font-medium">{dateFormatter.format(date)}</div>
                            {stats ? (
                              <div className="mt-0.5 space-y-0.5 text-muted-foreground">
                                <div>
                                  P/L:{" "}
                                  <span
                                    className={
                                      stats.profit > 0
                                        ? "font-medium text-emerald-400"
                                        : stats.profit < 0
                                          ? "font-medium text-red-400"
                                          : "font-medium text-foreground"
                                    }
                                  >
                                    {formatCurrency(stats.profit, { signed: true })}
                                  </span>
                                </div>
                                <div>
                                  Trades: <span className="font-medium text-foreground">{stats.tradeCount}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-0.5 text-muted-foreground">No trades</div>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="ml-7 mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
              {mode === "profit" ? (
                <>
                  <span>Loss</span>
                  <Swatch className="bg-red-500/70 border-red-500/40" />
                  <Swatch className="bg-red-500/45 border-red-500/30" />
                  <Swatch className="bg-red-500/25 border-red-500/20" />
                  <Swatch className="bg-muted/60 border-border" />
                  <Swatch className="bg-emerald-500/25 border-emerald-500/20" />
                  <Swatch className="bg-emerald-500/45 border-emerald-500/30" />
                  <Swatch className="bg-emerald-500/70 border-emerald-500/40" />
                  <span>Profit</span>
                </>
              ) : (
                <>
                  <span>Less</span>
                  <Swatch className="bg-muted/60 border-border" />
                  <Swatch className="bg-emerald-500/20 border-emerald-500/20" />
                  <Swatch className="bg-emerald-500/40 border-emerald-500/30" />
                  <Swatch className="bg-emerald-500/60 border-emerald-500/40" />
                  <Swatch className="bg-emerald-500/80 border-emerald-500/50" />
                  <span>More</span>
                </>
              )}
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  )
}

function Swatch({ className }: { className: string }) {
  return <span className={`size-[11px] rounded-[3px] border sm:size-[13px] ${className}`} aria-hidden />
}

function getCellTone(
  mode: Mode,
  stats: DayStats | undefined,
  bounds: { maxProfit: number; maxLoss: number; maxTrades: number },
): { className: string } {
  if (!stats) return { className: "bg-muted/40" }

  if (mode === "activity") {
    if (bounds.maxTrades === 0) return { className: "bg-muted/40" }
    const ratio = stats.tradeCount / bounds.maxTrades
    if (ratio === 0) return { className: "bg-muted/40" }
    if (ratio < 0.25) return { className: "bg-emerald-500/20 border-emerald-500/20" }
    if (ratio < 0.5) return { className: "bg-emerald-500/40 border-emerald-500/30" }
    if (ratio < 0.75) return { className: "bg-emerald-500/60 border-emerald-500/40" }
    return { className: "bg-emerald-500/80 border-emerald-500/50" }
  }

  // profit mode
  if (stats.profit === 0) return { className: "bg-muted/60" }
  if (stats.profit > 0) {
    const ratio = bounds.maxProfit === 0 ? 0 : stats.profit / bounds.maxProfit
    if (ratio < 0.33) return { className: "bg-emerald-500/25 border-emerald-500/20" }
    if (ratio < 0.66) return { className: "bg-emerald-500/45 border-emerald-500/30" }
    return { className: "bg-emerald-500/70 border-emerald-500/40" }
  }
  const lossRatio = bounds.maxLoss === 0 ? 0 : stats.profit / bounds.maxLoss
  if (lossRatio < 0.33) return { className: "bg-red-500/25 border-red-500/20" }
  if (lossRatio < 0.66) return { className: "bg-red-500/45 border-red-500/30" }
  return { className: "bg-red-500/70 border-red-500/40" }
}
