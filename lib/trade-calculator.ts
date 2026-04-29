import { getSymbolConfig, type SymbolKey } from "./symbols"
import type { TradeDirection } from "./mock-trades"

export type PriceValidation = {
  ok: boolean
  message: string | null
}

export function validatePrices(
  direction: TradeDirection,
  entry: number,
  stopLoss: number,
  takeProfit: number,
): PriceValidation {
  if (![entry, stopLoss, takeProfit].every(Number.isFinite)) {
    return { ok: false, message: null }
  }
  if (direction === "BUY") {
    if (stopLoss >= entry) return { ok: false, message: "For BUY, Stop Loss must be below Entry." }
    if (takeProfit <= entry) return { ok: false, message: "For BUY, Take Profit must be above Entry." }
  } else {
    if (stopLoss <= entry) return { ok: false, message: "For SELL, Stop Loss must be above Entry." }
    if (takeProfit >= entry) return { ok: false, message: "For SELL, Take Profit must be below Entry." }
  }
  return { ok: true, message: null }
}

export type CalcInput = {
  symbol: SymbolKey | string
  direction: TradeDirection
  entry: number
  stopLoss: number
  takeProfit: number
  lotSize: number
}

export type CalcResult = {
  riskDistance: number
  rewardDistance: number
  slPips: number
  tpPips: number
  rrRatio: number
  rrLabel: string
  estimatedLoss: number
  estimatedProfit: number
  pipLabel: "pips" | "points"
  decimals: number
}

export function calcTrade(input: CalcInput): CalcResult {
  const cfg = getSymbolConfig(input.symbol)
  const { direction, entry, stopLoss, takeProfit, lotSize } = input

  const riskDistance = direction === "BUY" ? entry - stopLoss : stopLoss - entry
  const rewardDistance = direction === "BUY" ? takeProfit - entry : entry - takeProfit

  const slPips = riskDistance / cfg.pipSize
  const tpPips = rewardDistance / cfg.pipSize

  const rrRatio = riskDistance > 0 && rewardDistance > 0 ? rewardDistance / riskDistance : 0

  const lots = Number.isFinite(lotSize) && lotSize > 0 ? lotSize : 0
  const estimatedLoss = riskDistance > 0 ? slPips * cfg.pipValuePerLot * lots : 0
  const estimatedProfit = rewardDistance > 0 ? tpPips * cfg.pipValuePerLot * lots : 0

  return {
    riskDistance: cleanNum(riskDistance),
    rewardDistance: cleanNum(rewardDistance),
    slPips: cleanNum(slPips),
    tpPips: cleanNum(tpPips),
    rrRatio: cleanNum(rrRatio),
    rrLabel: formatRR(rrRatio),
    estimatedLoss: cleanNum(estimatedLoss),
    estimatedProfit: cleanNum(estimatedProfit),
    pipLabel: cfg.pipLabel,
    decimals: cfg.decimals,
  }
}

export type ReverseInput = {
  symbol: SymbolKey | string
  direction: TradeDirection
  accountBalance: number
  riskPercent: number
  entry: number
  stopLoss: number
  desiredRR: number
}

export type ReverseResult = {
  riskAmount: number
  lotSize: number
  takeProfit: number
  slPips: number
  tpPips: number
  rrLabel: string
  estimatedLoss: number
  estimatedProfit: number
  pipLabel: "pips" | "points"
  decimals: number
}

export function reverseCalc(input: ReverseInput): ReverseResult {
  const cfg = getSymbolConfig(input.symbol)
  const { direction, accountBalance, riskPercent, entry, stopLoss, desiredRR } = input

  const slDistance = direction === "BUY" ? entry - stopLoss : stopLoss - entry
  const slPips = slDistance / cfg.pipSize

  const riskAmount = accountBalance > 0 && riskPercent > 0 ? (accountBalance * riskPercent) / 100 : 0

  const denom = slPips * cfg.pipValuePerLot
  const lotSize = denom > 0 ? riskAmount / denom : 0

  const tpDistance = slDistance > 0 ? slDistance * desiredRR : 0
  const takeProfit = direction === "BUY" ? entry + tpDistance : entry - tpDistance
  const tpPips = tpDistance / cfg.pipSize

  const estimatedLoss = riskAmount
  const estimatedProfit = tpPips * cfg.pipValuePerLot * lotSize

  return {
    riskAmount: cleanNum(riskAmount),
    lotSize: cleanNum(lotSize, 4),
    takeProfit: cleanNum(takeProfit, cfg.decimals),
    slPips: cleanNum(slPips),
    tpPips: cleanNum(tpPips),
    rrLabel: formatRR(desiredRR),
    estimatedLoss: cleanNum(estimatedLoss),
    estimatedProfit: cleanNum(estimatedProfit),
    pipLabel: cfg.pipLabel,
    decimals: cfg.decimals,
  }
}

export function formatRR(rr: number): string {
  if (!Number.isFinite(rr) || rr <= 0) return "—"
  // Round to 1 decimal, drop trailing zero.
  const v = Math.round(rr * 10) / 10
  const trimmed = Number.isInteger(v) ? `${v}` : v.toFixed(1)
  return `1:${trimmed}`
}

function cleanNum(n: number, decimals = 2): number {
  if (!Number.isFinite(n)) return 0
  const f = Math.pow(10, decimals)
  return Math.round(n * f) / f
}

export type ChecklistStatus = {
  completed: number
  total: number
  score: number
  label: "Weak setup" | "Average setup" | "Good setup" | "A+ setup" | "No items"
  tone: "red" | "yellow" | "green" | "muted"
}

export function checklistStatus(items: { checked: boolean }[]): ChecklistStatus {
  const total = items.length
  if (total === 0) {
    return { completed: 0, total: 0, score: 0, label: "No items", tone: "muted" }
  }
  const completed = items.filter((i) => i.checked).length
  const score = Math.round((completed / total) * 100)

  if (score >= 90) return { completed, total, score, label: "A+ setup", tone: "green" }
  if (score >= 70) return { completed, total, score, label: "Good setup", tone: "green" }
  if (score >= 40) return { completed, total, score, label: "Average setup", tone: "yellow" }
  return { completed, total, score, label: "Weak setup", tone: "red" }
}
