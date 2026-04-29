"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { generateMockTrades, type Trade, type TradeResult } from "@/lib/mock-trades"

const TRADES_STORAGE_KEY = "tj.user_trades.v1"
const HIDDEN_SEED_STORAGE_KEY = "tj.hidden_seed_ids.v1"

type StoredTrade = Omit<Trade, "createdAt" | "updatedAt"> & {
  createdAt: string
  updatedAt?: string
}

type TradeStoreContextValue = {
  trades: Trade[]
  /** Only the user-saved trades (excludes the seeded mock data). */
  userTrades: Trade[]
  addTrade: (trade: Trade) => void
  /** Updates a trade (user-saved or seed). Seed trades are forked into userTrades on first edit. */
  updateTrade: (id: string, updates: Partial<Trade>) => void
  /** Applies a TP/SL/BE result and recomputes profitLoss / balance impact. */
  applyResult: (id: string, result: TradeResult, manualPL?: number) => void
  removeTrade: (id: string) => void
  isHydrated: boolean
}

const TradeStoreContext = createContext<TradeStoreContextValue | null>(null)

function loadUserTrades(): Trade[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(TRADES_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as StoredTrade[]
    return parsed.map((t) => ({
      ...t,
      createdAt: new Date(t.createdAt),
      updatedAt: t.updatedAt ? new Date(t.updatedAt) : undefined,
    }))
  } catch {
    return []
  }
}

function persistUserTrades(trades: Trade[]) {
  if (typeof window === "undefined") return
  try {
    const serializable: StoredTrade[] = trades.map((t) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt ? t.updatedAt.toISOString() : undefined,
    }))
    window.localStorage.setItem(TRADES_STORAGE_KEY, JSON.stringify(serializable))
  } catch (err) {
    console.log("[v0] Failed to persist trades:", (err as Error).message)
  }
}

function loadHiddenSeedIds(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(HIDDEN_SEED_STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as string[]
  } catch {
    return []
  }
}

function persistHiddenSeedIds(ids: string[]) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(HIDDEN_SEED_STORAGE_KEY, JSON.stringify(ids))
  } catch (err) {
    console.log("[v0] Failed to persist hidden seed ids:", (err as Error).message)
  }
}

/** Computes the new profitLoss for a trade given a TP/SL/BE result. */
function computeResultPL(trade: Trade, result: TradeResult, manualPL?: number): number {
  if (result === "BE") return 0
  if (typeof manualPL === "number" && Number.isFinite(manualPL)) {
    // Manual override wins — but enforce sign convention for safety.
    if (result === "TP") return Math.abs(manualPL)
    if (result === "SL") return -Math.abs(manualPL)
  }
  if (result === "TP") {
    if (typeof trade.estimatedProfit === "number" && trade.estimatedProfit > 0) return trade.estimatedProfit
    // Fall back to the trade's existing positive P/L or the absolute of profitLoss.
    return Math.abs(trade.profitLoss) || 0
  }
  // SL
  if (typeof trade.estimatedLoss === "number" && trade.estimatedLoss > 0) return -trade.estimatedLoss
  return -Math.abs(trade.profitLoss) || 0
}

function statusFromResult(result: TradeResult): NonNullable<Trade["status"]> {
  if (result === "TP") return "WIN"
  if (result === "SL") return "LOSS"
  return "BREAK_EVEN"
}

export function TradeStoreProvider({ children }: { children: React.ReactNode }) {
  // Seed data is deterministic, so it's safe to compute on both server and client.
  const [seedTrades] = useState<Trade[]>(() => generateMockTrades(200))
  const [userTrades, setUserTrades] = useState<Trade[]>([])
  const [hiddenSeedIds, setHiddenSeedIds] = useState<string[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setUserTrades(loadUserTrades())
    setHiddenSeedIds(loadHiddenSeedIds())
    setIsHydrated(true)
  }, [])

  const addTrade = useCallback((trade: Trade) => {
    setUserTrades((prev) => {
      const next = [...prev, trade]
      persistUserTrades(next)
      return next
    })
  }, [])

  /**
   * Internal: forks a seed trade into userTrades by id, hides the seed, and applies updates.
   * Returns true if the id corresponded to a seed trade.
   */
  const forkSeedIfNeeded = useCallback(
    (id: string, updates: Partial<Trade>) => {
      const seed = seedTrades.find((t) => t.id === id)
      if (!seed) return false
      const merged: Trade = {
        ...seed,
        ...updates,
        id: seed.id,
        createdAt: seed.createdAt,
        updatedAt: new Date(),
      }
      setUserTrades((prev) => {
        const next = [...prev.filter((t) => t.id !== id), merged]
        persistUserTrades(next)
        return next
      })
      setHiddenSeedIds((prev) => {
        if (prev.includes(id)) return prev
        const next = [...prev, id]
        persistHiddenSeedIds(next)
        return next
      })
      return true
    },
    [seedTrades],
  )

  const updateTrade = useCallback(
    (id: string, updates: Partial<Trade>) => {
      const inUser = userTrades.some((t) => t.id === id)
      if (inUser) {
        setUserTrades((prev) => {
          const next = prev.map((t) => (t.id === id ? { ...t, ...updates, id, updatedAt: new Date() } : t))
          persistUserTrades(next)
          return next
        })
        return
      }
      // Fork the seed trade into userTrades and hide the original.
      forkSeedIfNeeded(id, updates)
    },
    [userTrades, forkSeedIfNeeded],
  )

  const applyResult = useCallback(
    (id: string, result: TradeResult, manualPL?: number) => {
      const findTrade = (): Trade | undefined => {
        const u = userTrades.find((t) => t.id === id)
        if (u) return u
        return seedTrades.find((t) => t.id === id)
      }
      const trade = findTrade()
      if (!trade) return

      const newPL = computeResultPL(trade, result, manualPL)
      const status = statusFromResult(result)

      // Double-counting protection: the running balance is derived by summing trade.profitLoss
      // across the dataset. Replacing profitLoss with the new value is the reversal — the
      // delta is automatically (newPL - previousPL). We track balanceImpactApplied for clarity.
      const updates: Partial<Trade> = {
        result,
        status,
        actualProfitLoss: newPL,
        profitLoss: +newPL.toFixed(2),
        balanceImpactApplied: +newPL.toFixed(2),
      }

      // Try to update an existing user trade first.
      const inUser = userTrades.some((t) => t.id === id)
      if (inUser) {
        setUserTrades((prev) => {
          const next = prev.map((t) => (t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t))
          persistUserTrades(next)
          return next
        })
        return
      }
      // Otherwise fork the seed trade.
      forkSeedIfNeeded(id, updates)
    },
    [userTrades, seedTrades, forkSeedIfNeeded],
  )

  const removeTrade = useCallback(
    (id: string) => {
      // If user trade — remove directly.
      const inUser = userTrades.some((t) => t.id === id)
      if (inUser) {
        setUserTrades((prev) => {
          const next = prev.filter((t) => t.id !== id)
          persistUserTrades(next)
          return next
        })
        // Also clear any hidden flag (defensive — shouldn't happen).
        setHiddenSeedIds((prev) => {
          if (!prev.includes(id)) return prev
          const next = prev.filter((x) => x !== id)
          persistHiddenSeedIds(next)
          return next
        })
        return
      }
      // Otherwise hide the seed trade.
      setHiddenSeedIds((prev) => {
        if (prev.includes(id)) return prev
        const next = [...prev, id]
        persistHiddenSeedIds(next)
        return next
      })
    },
    [userTrades],
  )

  const trades = useMemo(() => {
    const hidden = new Set(hiddenSeedIds)
    const visibleSeed = seedTrades.filter((t) => !hidden.has(t.id))
    return [...visibleSeed, ...userTrades].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  }, [seedTrades, userTrades, hiddenSeedIds])

  const value = useMemo<TradeStoreContextValue>(
    () => ({ trades, userTrades, addTrade, updateTrade, applyResult, removeTrade, isHydrated }),
    [trades, userTrades, addTrade, updateTrade, applyResult, removeTrade, isHydrated],
  )

  return <TradeStoreContext.Provider value={value}>{children}</TradeStoreContext.Provider>
}

export function useTradeStore(): TradeStoreContextValue {
  const ctx = useContext(TradeStoreContext)
  if (!ctx) throw new Error("useTradeStore must be used inside <TradeStoreProvider>")
  return ctx
}
