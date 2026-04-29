"use client"

import { useState } from "react"
import { ArrowDownRight, ArrowUpRight, Pencil, TrendingDown, TrendingUp, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { EditTradeForm } from "@/components/edit-trade-form"
import { useTradeStore } from "@/components/trade-store-provider"
import type { Trade, TradeResult } from "@/lib/mock-trades"
import { type DayStats, formatCurrency } from "@/lib/trade-utils"
import { getTradeDirection, getTradeStatus, STATUS_LABEL, STATUS_TONE } from "@/lib/trade-display"

type Props = {
  day: DayStats | null
  date: Date | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
})

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
})

export function DayTradesDialog({ day, date, open, onOpenChange }: Props) {
  const displayDate = date ?? day?.date ?? null
  const isWin = (day?.profit ?? 0) > 0
  const isLoss = (day?.profit ?? 0) < 0

  const { updateTrade, applyResult, removeTrade } = useTradeStore()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  function handleResult(trade: Trade, result: TradeResult) {
    applyResult(trade.id, result)
    const label = result === "TP" ? "TP — Win recorded" : result === "SL" ? "SL — Loss recorded" : "Break-even recorded"
    toast.success(label, { description: `${trade.symbol} updated.` })
  }

  function handleSaveEdit(id: string, updates: Partial<Trade>) {
    updateTrade(id, updates)
    setEditingId(null)
    toast.success("Trade updated", { description: "Calendar and stats refreshed." })
  }

  function handleConfirmDelete() {
    if (!confirmDeleteId) return
    removeTrade(confirmDeleteId)
    toast.success("Trade deleted", { description: "Balance reverted." })
    setConfirmDeleteId(null)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-balance">
              {displayDate ? dateFormatter.format(displayDate) : "Trades"}
            </DialogTitle>
            <DialogDescription>
              {day
                ? `${day.tradeCount} trade${day.tradeCount === 1 ? "" : "s"} • ${day.winCount}W / ${day.lossCount}L`
                : "No trades placed on this day."}
            </DialogDescription>
          </DialogHeader>

          {day ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <SummaryStat
                  label="Net P/L"
                  value={formatCurrency(day.profit, { signed: true })}
                  tone={isWin ? "win" : isLoss ? "loss" : "neutral"}
                  icon={isWin ? TrendingUp : isLoss ? TrendingDown : undefined}
                />
                <SummaryStat label="Trades" value={day.tradeCount.toString()} tone="neutral" />
                <SummaryStat
                  label="Win Rate"
                  value={`${day.tradeCount === 0 ? 0 : Math.round((day.winCount / day.tradeCount) * 100)}%`}
                  tone="neutral"
                />
              </div>

              <ScrollArea className="max-h-[60vh] rounded-lg border border-border bg-card">
                <ul className="divide-y divide-border">
                  {day.trades
                    .slice()
                    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
                    .map((t) => (
                      <li key={t.id} className="p-3 sm:p-4">
                        <TradeRow
                          trade={t}
                          isEditing={editingId === t.id}
                          onEdit={() => setEditingId(t.id)}
                          onCancelEdit={() => setEditingId(null)}
                          onSave={(updates) => handleSaveEdit(t.id, updates)}
                          onResult={(r) => handleResult(t, r)}
                          onDelete={() => setConfirmDeleteId(t.id)}
                        />
                      </li>
                    ))}
                </ul>
              </ScrollArea>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground">No trades were placed on this day.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirmDeleteId !== null}
        onOpenChange={(o) => {
          if (!o) setConfirmDeleteId(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this trade?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the trade and reverses its impact on your account balance, calendar
              total, and dashboard stats.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-500 text-white hover:bg-red-500/90 focus:ring-red-500"
            >
              Delete trade
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function TradeRow({
  trade,
  isEditing,
  onEdit,
  onCancelEdit,
  onSave,
  onResult,
  onDelete,
}: {
  trade: Trade
  isEditing: boolean
  onEdit: () => void
  onCancelEdit: () => void
  onSave: (updates: Partial<Trade>) => void
  onResult: (r: TradeResult) => void
  onDelete: () => void
}) {
  const direction = getTradeDirection(trade)
  const status = getTradeStatus(trade)
  const positive = trade.profitLoss > 0
  const negative = trade.profitLoss < 0
  const lot = trade.lotSize ?? trade.quantity

  if (isEditing) {
    return <EditTradeForm trade={trade} onSave={onSave} onCancel={onCancelEdit} />
  }

  return (
    <div className="space-y-3">
      {/* Top row: identity + status + P/L */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold tracking-tight">{trade.symbol}</span>
          <Badge
            variant="outline"
            className={
              direction === "BUY"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-red-500/30 bg-red-500/10 text-red-400"
            }
          >
            {direction === "BUY" ? <ArrowUpRight className="mr-1 size-3" /> : <ArrowDownRight className="mr-1 size-3" />}
            {direction}
          </Badge>
          <Badge variant="outline" className={STATUS_TONE[status]}>
            {STATUS_LABEL[status]}
          </Badge>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span
            className={`text-sm font-semibold tabular-nums ${
              positive ? "text-emerald-400" : negative ? "text-red-400" : "text-muted-foreground"
            }`}
          >
            {formatCurrency(trade.profitLoss, { signed: true })}
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {timeFormatter.format(trade.createdAt)}
          </span>
        </div>
      </div>

      {/* Spec grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4">
        <Spec label="Lot" value={formatNumber(lot)} />
        <Spec label="Entry" value={formatNumber(trade.entryPrice)} />
        <Spec label="SL" value={trade.stopLoss !== undefined ? formatNumber(trade.stopLoss) : "—"} />
        <Spec label="TP" value={trade.takeProfit !== undefined ? formatNumber(trade.takeProfit) : "—"} />
      </div>

      {/* Action row: result buttons + edit/delete */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5" role="group" aria-label="Trade result">
          <ResultButton
            active={trade.result === "TP" || (status === "WIN" && !trade.result)}
            tone="win"
            label="TP"
            onClick={() => onResult("TP")}
          />
          <ResultButton
            active={trade.result === "SL" || (status === "LOSS" && !trade.result)}
            tone="loss"
            label="SL"
            onClick={() => onResult("SL")}
          />
          <ResultButton
            active={trade.result === "BE" || (status === "BREAK_EVEN" && !trade.result)}
            tone="be"
            label="BE"
            onClick={() => onResult("BE")}
          />
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <Button size="sm" variant="ghost" onClick={onEdit} aria-label="Edit trade">
            <Pencil className="mr-1.5 size-3.5" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onDelete}
            aria-label="Delete trade"
            className="border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300"
          >
            <Trash2 className="mr-1.5 size-3.5" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums text-foreground">{value}</span>
    </div>
  )
}

function ResultButton({
  active,
  tone,
  label,
  onClick,
}: {
  active: boolean
  tone: "win" | "loss" | "be"
  label: string
  onClick: () => void
}) {
  const base =
    "h-7 px-2.5 text-xs font-semibold border transition-colors disabled:opacity-50 cursor-pointer rounded-md"
  const tones = {
    win: active
      ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/25"
      : "border-border bg-transparent text-muted-foreground hover:border-emerald-500/40 hover:text-emerald-400",
    loss: active
      ? "border-red-500/50 bg-red-500/20 text-red-300 hover:bg-red-500/25"
      : "border-border bg-transparent text-muted-foreground hover:border-red-500/40 hover:text-red-400",
    be: active
      ? "border-sky-500/50 bg-sky-500/20 text-sky-300 hover:bg-sky-500/25"
      : "border-border bg-transparent text-muted-foreground hover:border-sky-500/40 hover:text-sky-400",
  }[tone]

  return (
    <button type="button" onClick={onClick} className={`${base} ${tones}`} aria-pressed={active}>
      {label}
    </button>
  )
}

function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return "—"
  // Choose a reasonable precision for prices and lot sizes.
  const abs = Math.abs(n)
  if (abs === 0) return "0"
  if (abs >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 2 })
  if (abs >= 10) return n.toFixed(2)
  if (abs >= 1) return n.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")
  return n.toFixed(5).replace(/0+$/, "").replace(/\.$/, "")
}

function SummaryStat({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string
  value: string
  tone: "win" | "loss" | "neutral"
  icon?: React.ComponentType<{ className?: string }>
}) {
  const toneClass =
    tone === "win" ? "text-emerald-400" : tone === "loss" ? "text-red-400" : "text-foreground"
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5">
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-1 flex items-center gap-1.5 text-lg font-semibold tabular-nums ${toneClass}`}>
        {Icon ? <Icon className="size-4" /> : null}
        {value}
      </div>
    </div>
  )
}
