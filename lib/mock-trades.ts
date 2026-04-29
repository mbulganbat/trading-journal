// Mock trade data shaped like the eventual Prisma `Trade` model.
// Easy to swap with a real DB query later — just preserve { id, symbol, side, profitLoss, createdAt }.

export type TradeSide = "long" | "short"
export type TradeDirection = "BUY" | "SELL"
export type TradeSession = "Asia" | "London" | "New York"
export type TradeStrategy = "SMC" | "ICT" | "Price Action" | "Breakout" | "Indicator"
export type TradeEmotion = "Calm" | "Fear" | "Greedy" | "Confident" | "FOMO"
export type TradeStatus = "WIN" | "LOSS" | "BREAK_EVEN" | "OPEN"
export type TradeResult = "TP" | "SL" | "BE"

export type ChecklistItem = {
  id: string
  label: string
  checked: boolean
}

export type Trade = {
  // Core fields used by dashboard / calendar / heatmap aggregations
  id: string
  symbol: string
  side: TradeSide
  quantity: number
  entryPrice: number
  exitPrice: number
  profitLoss: number
  createdAt: Date

  // Extended journal fields (optional — present on user-saved trades)
  account?: string
  /** ID of the account this trade belongs to. Required on user-saved trades. */
  accountId?: string
  direction?: TradeDirection
  stopLoss?: number
  takeProfit?: number
  lotSize?: number
  riskAmount?: number
  riskPercent?: number
  rewardAmount?: number
  rrRatio?: number
  slDistance?: number
  tpDistance?: number
  estimatedLoss?: number
  estimatedProfit?: number
  actualProfitLoss?: number
  session?: TradeSession
  strategy?: TradeStrategy
  emotion?: TradeEmotion
  mistakes?: string[]
  notes?: string
  checklistItems?: ChecklistItem[]
  checklistCompleted?: number
  checklistScore?: number
  screenshotUrl?: string
  isJournal?: boolean
  updatedAt?: Date

  // Result tracking — set when a user assigns TP / SL / BE to a trade
  status?: TradeStatus
  result?: TradeResult
  /** Last P/L value that has been applied to the running balance. Used to reverse before re-applying. */
  balanceImpactApplied?: number
}

const SYMBOLS = ["AAPL", "MSFT", "NVDA", "TSLA", "SPY", "QQQ", "AMD", "META", "GOOGL", "AMZN"]

// Deterministic pseudo-random so the UI is stable across renders / SSR.
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)]
}

/**
 * Generates ~`days` days of mock trades ending today.
 * Mix of winning days, losing days, and no-trade days for a realistic distribution.
 */
export function generateMockTrades(days = 200, seed = 42): Trade[] {
  const rng = mulberry32(seed)
  const trades: Trade[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let d = 0; d < days; d++) {
    const date = new Date(today)
    date.setDate(today.getDate() - d)

    const dow = date.getDay()
    // No trades on weekends most of the time
    if (dow === 0 || dow === 6) {
      if (rng() > 0.1) continue
    }
    // ~20% chance of no trades on a weekday
    if (rng() < 0.2) continue

    const tradeCount = 1 + Math.floor(rng() * 6) // 1–6 trades
    // Bias each day slightly winning or losing
    const dayBias = rng() < 0.55 ? 1 : -1

    for (let i = 0; i < tradeCount; i++) {
      const symbol = pick(rng, SYMBOLS)
      const side: TradeSide = rng() < 0.65 ? "long" : "short"
      const entryPrice = 50 + rng() * 450
      const quantity = 10 + Math.floor(rng() * 90)
      const moveBase = (rng() - 0.5) * 0.04 // ±2%
      const move = moveBase + dayBias * 0.008 // bias toward day's direction
      const exitPrice = Math.max(1, entryPrice * (1 + move))
      const directional = side === "long" ? exitPrice - entryPrice : entryPrice - exitPrice
      const profitLoss = +(directional * quantity).toFixed(2)

      const createdAt = new Date(date)
      createdAt.setHours(9 + Math.floor(rng() * 7), Math.floor(rng() * 60), 0, 0)

      trades.push({
        id: `t_${d}_${i}_${Math.floor(rng() * 1e9)}`,
        symbol,
        side,
        quantity,
        entryPrice: +entryPrice.toFixed(2),
        exitPrice: +exitPrice.toFixed(2),
        profitLoss,
        createdAt,
      })
    }
  }

  return trades.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
}
