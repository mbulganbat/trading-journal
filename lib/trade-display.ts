import type { Trade, TradeDirection, TradeStatus } from "./mock-trades"

/** Derives the canonical status of a trade, falling back to profitLoss sign for legacy data. */
export function getTradeStatus(trade: Trade): TradeStatus {
  if (trade.status) return trade.status
  if (trade.profitLoss > 0) return "WIN"
  if (trade.profitLoss < 0) return "LOSS"
  return "BREAK_EVEN"
}

/** Derives BUY/SELL from explicit `direction` or legacy `side`. */
export function getTradeDirection(trade: Trade): TradeDirection {
  if (trade.direction) return trade.direction
  return trade.side === "long" ? "BUY" : "SELL"
}

export const STATUS_LABEL: Record<TradeStatus, string> = {
  WIN: "WIN",
  LOSS: "LOSS",
  BREAK_EVEN: "BE",
  OPEN: "OPEN",
}

export const STATUS_TONE: Record<TradeStatus, string> = {
  WIN: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  LOSS: "border-red-500/30 bg-red-500/10 text-red-400",
  BREAK_EVEN: "border-sky-500/30 bg-sky-500/10 text-sky-400",
  OPEN: "border-amber-500/30 bg-amber-500/10 text-amber-400",
}
