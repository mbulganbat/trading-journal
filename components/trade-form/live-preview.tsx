"use client"

import { ArrowDownRight, ArrowUpRight, Target } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { type ChecklistItem, type TradeDirection } from "@/lib/mock-trades"
import { checklistStatus, type CalcResult } from "@/lib/trade-calculator"
import { formatCurrency } from "@/lib/trade-utils"
import { formatPrice } from "@/lib/symbols"

type Props = {
  symbol: string
  direction: TradeDirection
  entry: number
  stopLoss: number
  takeProfit: number
  lotSize: number
  riskAmount: number
  calc: CalcResult
  checklist: ChecklistItem[]
  validationError: string | null
}

export function LivePreview({
  symbol,
  direction,
  entry,
  stopLoss,
  takeProfit,
  lotSize,
  riskAmount,
  calc,
  checklist,
  validationError,
}: Props) {
  const status = checklistStatus(checklist)

  const checklistTone =
    status.tone === "green"
      ? "text-emerald-400"
      : status.tone === "yellow"
        ? "text-amber-400"
        : status.tone === "red"
          ? "text-red-400"
          : "text-muted-foreground"

  const checklistBar =
    status.tone === "green"
      ? "bg-emerald-500"
      : status.tone === "yellow"
        ? "bg-amber-400"
        : status.tone === "red"
          ? "bg-red-500"
          : "bg-muted-foreground/40"

  return (
    <Card className="sticky top-6 overflow-hidden">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base font-semibold">Live Preview</CardTitle>
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
        </div>
        <div className="mt-1 flex items-baseline gap-2 text-xl font-semibold tracking-tight">
          <span>{symbol || "—"}</span>
          <span className="text-xs font-normal text-muted-foreground">{lotSize.toFixed(2)} lot</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-5">
        {/* Prices */}
        <div className="grid grid-cols-3 gap-2">
          <PriceTile label="Entry" value={Number.isFinite(entry) ? formatPrice(entry, symbol) : "—"} tone="neutral" />
          <PriceTile
            label="Stop Loss"
            value={Number.isFinite(stopLoss) ? formatPrice(stopLoss, symbol) : "—"}
            tone="loss"
          />
          <PriceTile
            label="Take Profit"
            value={Number.isFinite(takeProfit) ? formatPrice(takeProfit, symbol) : "—"}
            tone="win"
          />
        </div>

        {validationError ? (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {validationError}
          </div>
        ) : null}

        {/* Distances */}
        <div className="grid grid-cols-2 gap-2">
          <Row
            label={`SL distance`}
            value={`${calc.slPips.toFixed(1)} ${calc.pipLabel}`}
            tone="loss"
          />
          <Row
            label={`TP distance`}
            value={`${calc.tpPips.toFixed(1)} ${calc.pipLabel}`}
            tone="win"
          />
        </div>

        {/* RR */}
        <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="size-4 text-sky-400" aria-hidden />
              <span className="text-xs font-medium uppercase tracking-wide text-sky-400">RR Ratio</span>
            </div>
            <span className="text-xl font-semibold tabular-nums text-sky-300">{calc.rrLabel}</span>
          </div>
        </div>

        {/* Money */}
        <div className="grid grid-cols-2 gap-2">
          <MoneyTile
            label="Risk"
            value={formatCurrency(riskAmount > 0 ? -riskAmount : -calc.estimatedLoss, { signed: true })}
            tone="loss"
          />
          <MoneyTile
            label="Reward"
            value={formatCurrency(calc.estimatedProfit, { signed: true })}
            tone="win"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <MoneyTile
            label="Est. Loss"
            value={formatCurrency(-calc.estimatedLoss, { signed: true })}
            tone="loss"
            subtle
          />
          <MoneyTile
            label="Est. Profit"
            value={formatCurrency(calc.estimatedProfit, { signed: true })}
            tone="win"
            subtle
          />
        </div>

        {/* Checklist quality */}
        <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium uppercase tracking-wide text-muted-foreground">Setup Quality</span>
            <span className={`font-semibold ${checklistTone}`}>
              {status.label} {status.total > 0 ? `• ${status.score}%` : ""}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
            <div
              className={`h-full transition-all duration-300 ${checklistBar}`}
              style={{ width: `${status.score}%` }}
              aria-hidden
            />
          </div>
          <div className="text-[11px] text-muted-foreground">
            {status.completed} of {status.total} rules confirmed
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PriceTile({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: "win" | "loss" | "neutral"
}) {
  const valueColor =
    tone === "win" ? "text-emerald-400" : tone === "loss" ? "text-red-400" : "text-foreground"
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5">
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-0.5 text-sm font-semibold tabular-nums ${valueColor}`}>{value}</div>
    </div>
  )
}

function Row({ label, value, tone }: { label: string; value: string; tone: "win" | "loss" }) {
  const valueColor = tone === "win" ? "text-emerald-400" : "text-red-400"
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${valueColor}`}>{value}</span>
    </div>
  )
}

function MoneyTile({
  label,
  value,
  tone,
  subtle,
}: {
  label: string
  value: string
  tone: "win" | "loss"
  subtle?: boolean
}) {
  const valueColor = tone === "win" ? "text-emerald-400" : "text-red-400"
  const bg = subtle
    ? "border-border bg-card"
    : tone === "win"
      ? "border-emerald-500/30 bg-emerald-500/10"
      : "border-red-500/30 bg-red-500/10"
  return (
    <div className={`rounded-lg border px-3 py-2.5 ${bg}`}>
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-0.5 text-base font-semibold tabular-nums ${valueColor}`}>{value}</div>
    </div>
  )
}
