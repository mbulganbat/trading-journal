import type { Trade } from "./mock-trades"

export const MAX_ACCOUNTS = 10

export type AccountType = "Demo" | "Challenge" | "Funded" | "Live"
export type BalanceMode = "Manual" | "Auto"

export const ACCOUNT_TYPES: AccountType[] = ["Demo", "Challenge", "Funded", "Live"]
export const BALANCE_MODES: BalanceMode[] = ["Manual", "Auto"]

export const CURRENCY_OPTIONS = ["USD", "EUR", "GBP", "JPY", "AUD", "CAD"] as const
export type Currency = (typeof CURRENCY_OPTIONS)[number]

export type Account = {
  id: string
  accountName: string
  brokerPlatform: string
  accountType: AccountType
  startingBalance: number
  /** For Manual mode this is the source of truth. For Auto mode it's recomputed from closed trades. */
  currentBalance: number
  currency: Currency
  balanceMode: BalanceMode
  createdAt: Date
  updatedAt: Date
}

/** Sums realized (closed) P&L for trades belonging to an account. */
export function closedPLForAccount(accountId: string, trades: Trade[]): number {
  let sum = 0
  for (const t of trades) {
    if (t.accountId !== accountId) continue
    // A trade is "closed" when it has a non-OPEN status, or when it has no explicit status
    // (legacy seed mock data behaves as closed).
    if (t.status && t.status === "OPEN") continue
    sum += t.profitLoss
  }
  return +sum.toFixed(2)
}

/** Returns the balance the dashboard / accounts page should display. */
export function effectiveBalance(account: Account, trades: Trade[]): number {
  if (account.balanceMode === "Auto") {
    return +(account.startingBalance + closedPLForAccount(account.id, trades)).toFixed(2)
  }
  return +account.currentBalance.toFixed(2)
}

export function formatAccountCurrency(value: number, currency: Currency, opts: { signed?: boolean } = {}): string {
  const abs = Math.abs(value)
  let formatted: string
  try {
    formatted = abs.toLocaleString("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: abs >= 1000 ? 0 : 2,
    })
  } catch {
    formatted = `${currency} ${abs.toFixed(2)}`
  }
  if (!opts.signed) return value < 0 ? `-${formatted}` : formatted
  if (value > 0) return `+${formatted}`
  if (value < 0) return `-${formatted}`
  return formatted
}

export function newAccountId(): string {
  return `acc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}
