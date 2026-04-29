"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DayTradesDialog } from "@/components/day-trades-dialog"
import { WeeklySummary } from "@/components/weekly-summary"
import {
  buildMonthGrid,
  type DayStats,
  formatCompact,
  formatCurrency,
  isSameDay,
  summarizeWeek,
  toDateKey,
} from "@/lib/trade-utils"

type Props = {
  dayMap: Map<string, DayStats>
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" })

export function TradingCalendar({ dayMap }: Props) {
  const today = useMemo(() => {
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    return t
  }, [])

  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  // Look up live stats from the current dayMap so the modal reflects edits/deletes immediately.
  const selectedStats = useMemo(
    () => (selectedDate ? (dayMap.get(toDateKey(selectedDate)) ?? null) : null),
    [selectedDate, dayMap],
  )

  const year = cursor.getFullYear()
  const month = cursor.getMonth()

  const weeks = useMemo(() => buildMonthGrid(year, month), [year, month])

  const monthStats = useMemo(() => {
    let profit = 0
    let trades = 0
    let winningDays = 0
    let losingDays = 0
    let tradingDays = 0
    for (const week of weeks) {
      for (const date of week) {
        if (date.getMonth() !== month) continue
        const stats = dayMap.get(toDateKey(date))
        if (!stats) continue
        profit += stats.profit
        trades += stats.tradeCount
        tradingDays += 1
        if (stats.profit > 0) winningDays += 1
        else if (stats.profit < 0) losingDays += 1
      }
    }
    return { profit: +profit.toFixed(2), trades, winningDays, losingDays, tradingDays }
  }, [weeks, dayMap, month])

  const weekSummaries = useMemo(
    () => weeks.map((w, i) => ({ ...summarizeWeek(w, dayMap, month), weekIndex: i })),
    [weeks, dayMap, month],
  )

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-xl font-semibold">{monthFormatter.format(cursor)}</CardTitle>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span
              className={
                monthStats.profit > 0
                  ? "font-medium text-emerald-400"
                  : monthStats.profit < 0
                    ? "font-medium text-red-400"
                    : "font-medium"
              }
            >
              {formatCurrency(monthStats.profit, { signed: true })}
            </span>
            <span>{monthStats.tradingDays} trading days</span>
            <span>{monthStats.trades} trades</span>
            <span>
              <span className="text-emerald-400">{monthStats.winningDays}W</span>
              {" / "}
              <span className="text-red-400">{monthStats.losingDays}L</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous month"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next month"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
          <div>
            <div className="grid grid-cols-7 gap-1.5 pb-2 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {WEEKDAYS.map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {weeks.flat().map((date, idx) => {
                const inMonth = date.getMonth() === month
                const stats = dayMap.get(toDateKey(date))
                const isToday = isSameDay(date, today)
                const isFuture = date.getTime() > today.getTime()

                let tone: "win" | "loss" | "flat" | "empty" = "empty"
                if (stats) tone = stats.profit > 0 ? "win" : stats.profit < 0 ? "loss" : "flat"

                const toneClasses = {
                  win: "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/50",
                  loss: "bg-red-500/10 border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50",
                  flat: "bg-muted/40 border-border hover:bg-muted/60",
                  empty: "bg-card border-border hover:bg-muted/40",
                }[tone]

                const valueColor =
                  tone === "win"
                    ? "text-emerald-400"
                    : tone === "loss"
                      ? "text-red-400"
                      : "text-muted-foreground"

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedDate(date)}
                    disabled={isFuture}
                    aria-label={`${date.toDateString()}${stats ? `, ${formatCurrency(stats.profit, { signed: true })}, ${stats.tradeCount} trades` : ", no trades"}`}
                    className={`group relative flex aspect-square min-h-[68px] flex-col items-start justify-between rounded-lg border p-1.5 text-left transition-all duration-150 sm:p-2 ${toneClasses} ${
                      inMonth ? "" : "opacity-40"
                    } ${isFuture ? "cursor-not-allowed opacity-30" : "cursor-pointer hover:-translate-y-0.5 hover:shadow-md"} ${
                      isToday ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : ""
                    }`}
                  >
                    <span
                      className={`text-xs font-semibold tabular-nums ${
                        isToday ? "text-foreground" : "text-foreground/80"
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    {stats ? (
                      <div className="flex w-full flex-col items-end gap-0.5">
                        <span className={`text-xs font-semibold tabular-nums sm:text-sm ${valueColor}`}>
                          {formatCompact(stats.profit)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {stats.tradeCount} {stats.tradeCount === 1 ? "trade" : "trades"}
                        </span>
                      </div>
                    ) : null}
                  </button>
                )
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <LegendDot className="bg-emerald-500/30 border-emerald-500/40" label="Profit" />
              <LegendDot className="bg-red-500/30 border-red-500/40" label="Loss" />
              <LegendDot className="bg-muted/60 border-border" label="No trades" />
            </div>
          </div>

          <WeeklySummary weeks={weekSummaries} monthIndex={month} />
        </div>
      </CardContent>

      <DayTradesDialog
        day={selectedStats}
        date={selectedDate}
        open={selectedDate !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedDate(null)
        }}
      />
    </Card>
  )
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`size-3 rounded-sm border ${className}`} aria-hidden />
      {label}
    </span>
  )
}
