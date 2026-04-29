"use client"

import { useMemo } from "react"
import { AccountSelector } from "@/components/account-selector"
import { useAccountStore } from "@/components/account-store-provider"
import { DashboardActions } from "@/components/dashboard-actions"
import { SiteNav } from "@/components/site-nav"
import { StatsOverview } from "@/components/stats-overview"
import { TradeHeatmap } from "@/components/trade-heatmap"
import { TradingCalendar } from "@/components/trading-calendar"
import { useTradeStore } from "@/components/trade-store-provider"
import { groupTradesByDay } from "@/lib/trade-utils"

export default function DashboardPage() {
  const { trades } = useTradeStore()
  const { accounts, selectedAccountIds } = useAccountStore()

  // When no accounts exist yet, show all (seed) trades so the dashboard isn't empty
  // for first-time users. Once accounts are created, only trades attached to selected
  // accounts appear, which avoids double-counting across multiple accounts.
  const filteredTrades = useMemo(() => {
    if (accounts.length === 0) return trades
    const allowAll = selectedAccountIds === null
    const allowedIds = new Set(allowAll ? accounts.map((a) => a.id) : selectedAccountIds!)
    return trades.filter((t) => (t.accountId ? allowedIds.has(t.accountId) : false))
  }, [trades, accounts, selectedAccountIds])

  const dayMap = useMemo(() => groupTradesByDay(filteredTrades), [filteredTrades])

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-balance">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              {accounts.length === 0
                ? "Calendar & progress overview"
                : selectedAccountIds === null
                  ? "All accounts"
                  : `${selectedAccountIds.length} of ${accounts.length} accounts selected`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <AccountSelector />
            <DashboardActions />
          </div>
        </header>

        <StatsOverview dayMap={dayMap} />

        <TradingCalendar dayMap={dayMap} />

        <TradeHeatmap dayMap={dayMap} weeks={26} />
      </div>
    </main>
  )
}
