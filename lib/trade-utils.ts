import type { Trade } from "./mock-trades"

export type DayStats = {
  date: Date
  dateKey: string // YYYY-MM-DD
  profit: number
  tradeCount: number
  winCount: number
  lossCount: number
  trades: Trade[]
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number)
  return new Date(y, m - 1, d)
}

/** Groups trades by calendar day and returns a map keyed by YYYY-MM-DD. */
export function groupTradesByDay(trades: Trade[]): Map<string, DayStats> {
  const map = new Map<string, DayStats>()
  for (const t of trades) {
    const date = new Date(t.createdAt)
    date.setHours(0, 0, 0, 0)
    const key = toDateKey(date)
    const existing = map.get(key)
    if (existing) {
      existing.profit += t.profitLoss
      existing.tradeCount += 1
      existing.winCount += t.profitLoss > 0 ? 1 : 0
      existing.lossCount += t.profitLoss < 0 ? 1 : 0
      existing.trades.push(t)
    } else {
      map.set(key, {
        date,
        dateKey: key,
        profit: t.profitLoss,
        tradeCount: 1,
        winCount: t.profitLoss > 0 ? 1 : 0,
        lossCount: t.profitLoss < 0 ? 1 : 0,
        trades: [t],
      })
    }
  }
  // Round to 2dp for cleaner display
  for (const stats of map.values()) {
    stats.profit = +stats.profit.toFixed(2)
  }
  return map
}

export function formatCurrency(value: number, opts: { signed?: boolean } = {}): string {
  const abs = Math.abs(value)
  const formatted = abs.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: abs >= 1000 ? 0 : 2,
  })
  if (!opts.signed) return value < 0 ? `-${formatted}` : formatted
  if (value > 0) return `+${formatted}`
  if (value < 0) return `-${formatted}`
  return formatted
}

export function formatCompact(value: number): string {
  const sign = value < 0 ? "-" : value > 0 ? "+" : ""
  const abs = Math.abs(value)
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(abs >= 10000 ? 0 : 1)}k`
  return `${sign}$${abs.toFixed(0)}`
}

/** Builds a 6-row × 7-col grid of dates covering the given month (Sun → Sat). */
export function buildMonthGrid(year: number, month: number): Date[][] {
  const firstOfMonth = new Date(year, month, 1)
  const startOffset = firstOfMonth.getDay() // 0 = Sun
  const gridStart = new Date(year, month, 1 - startOffset)

  const weeks: Date[][] = []
  for (let w = 0; w < 6; w++) {
    const week: Date[] = []
    for (let d = 0; d < 7; d++) {
      const date = new Date(gridStart)
      date.setDate(gridStart.getDate() + w * 7 + d)
      week.push(date)
    }
    weeks.push(week)
  }
  return weeks
}

export type WeekSummary = {
  weekIndex: number
  startDate: Date
  endDate: Date
  profit: number
  tradingDays: number
  tradeCount: number
}

export function summarizeWeek(week: Date[], dayMap: Map<string, DayStats>, monthIndex: number): WeekSummary {
  let profit = 0
  let tradingDays = 0
  let tradeCount = 0
  for (const date of week) {
    if (date.getMonth() !== monthIndex) continue
    const stats = dayMap.get(toDateKey(date))
    if (!stats) continue
    profit += stats.profit
    tradingDays += 1
    tradeCount += stats.tradeCount
  }
  return {
    weekIndex: 0,
    startDate: week[0],
    endDate: week[6],
    profit: +profit.toFixed(2),
    tradingDays,
    tradeCount,
  }
}

/** Builds the columns of weeks (newest on the right) for a GitHub-style heatmap. */
export function buildHeatmapWeeks(endDate: Date, weeks = 26): Date[][] {
  // Anchor the rightmost column on the Saturday on/after `endDate`.
  const end = new Date(endDate)
  end.setHours(0, 0, 0, 0)
  const daysToSat = 6 - end.getDay()
  const lastSat = new Date(end)
  lastSat.setDate(end.getDate() + daysToSat)

  const cols: Date[][] = []
  for (let w = weeks - 1; w >= 0; w--) {
    const col: Date[] = []
    for (let d = 0; d < 7; d++) {
      const date = new Date(lastSat)
      date.setDate(lastSat.getDate() - w * 7 - (6 - d))
      col.push(date)
    }
    cols.push(col)
  }
  return cols
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
