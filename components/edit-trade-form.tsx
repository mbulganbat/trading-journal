"use client"

import { useMemo, useState } from "react"
import { Save, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import type { ChecklistItem, Trade, TradeDirection, TradeStatus } from "@/lib/mock-trades"
import { calcTrade, validatePrices } from "@/lib/trade-calculator"
import { SYMBOL_KEYS } from "@/lib/symbols"
import { getTradeDirection, getTradeStatus } from "@/lib/trade-display"

type Props = {
  trade: Trade
  onSave: (updates: Partial<Trade>) => void
  onCancel: () => void
}

const STATUS_OPTIONS: { value: TradeStatus; label: string }[] = [
  { value: "OPEN", label: "Open" },
  { value: "WIN", label: "Win" },
  { value: "LOSS", label: "Loss" },
  { value: "BREAK_EVEN", label: "Break Even" },
]

export function EditTradeForm({ trade, onSave, onCancel }: Props) {
  const initialSymbol = trade.symbol || "EURUSD"
  const initialDirection = getTradeDirection(trade)

  const [symbol, setSymbol] = useState<string>(initialSymbol)
  const [direction, setDirection] = useState<TradeDirection>(initialDirection)
  const [lotSize, setLotSize] = useState<string>(
    trade.lotSize !== undefined ? String(trade.lotSize) : String(trade.quantity),
  )
  const [entry, setEntry] = useState<string>(String(trade.entryPrice ?? ""))
  const [stopLoss, setStopLoss] = useState<string>(trade.stopLoss !== undefined ? String(trade.stopLoss) : "")
  const [takeProfit, setTakeProfit] = useState<string>(
    trade.takeProfit !== undefined ? String(trade.takeProfit) : "",
  )
  const [actualPL, setActualPL] = useState<string>(
    trade.actualProfitLoss !== undefined ? String(trade.actualProfitLoss) : String(trade.profitLoss ?? 0),
  )
  const [status, setStatus] = useState<TradeStatus>(getTradeStatus(trade))
  const [notes, setNotes] = useState<string>(trade.notes ?? "")
  const [screenshotUrl, setScreenshotUrl] = useState<string>(trade.screenshotUrl ?? "")
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    (trade.checklistItems ?? []).map((c) => ({ ...c })),
  )

  const entryNum = Number.parseFloat(entry)
  const slNum = Number.parseFloat(stopLoss)
  const tpNum = Number.parseFloat(takeProfit)
  const lotNum = Number.parseFloat(lotSize)

  const calc = useMemo(() => {
    if (![entryNum, slNum, tpNum, lotNum].every(Number.isFinite)) return null
    if (!validatePrices(direction, entryNum, slNum, tpNum).ok) return null
    return calcTrade({
      symbol,
      direction,
      entry: entryNum,
      stopLoss: slNum,
      takeProfit: tpNum,
      lotSize: lotNum,
    })
  }, [symbol, direction, entryNum, slNum, tpNum, lotNum])

  function handleChecklistToggle(id: string) {
    setChecklist((prev) => prev.map((c) => (c.id === id ? { ...c, checked: !c.checked } : c)))
  }

  function handleScreenshot(file: File | undefined) {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Screenshot must be under 5MB.")
      return
    }
    const reader = new FileReader()
    reader.onload = () => setScreenshotUrl(typeof reader.result === "string" ? reader.result : "")
    reader.readAsDataURL(file)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!Number.isFinite(entryNum)) {
      toast.error("Entry price is required.")
      return
    }
    if (Number.isFinite(slNum) && Number.isFinite(tpNum)) {
      const v = validatePrices(direction, entryNum, slNum, tpNum)
      if (!v.ok && v.message) {
        toast.error(v.message)
        return
      }
    }
    const plNum = Number.parseFloat(actualPL)

    // Sign correction by status (manual override still wins over magnitude).
    let resolvedPL = Number.isFinite(plNum) ? plNum : trade.profitLoss
    if (status === "BREAK_EVEN") resolvedPL = 0
    if (status === "WIN") resolvedPL = Math.abs(resolvedPL)
    if (status === "LOSS") resolvedPL = -Math.abs(resolvedPL)

    const checklistCompleted = checklist.filter((c) => c.checked).length
    const checklistScore = checklist.length > 0 ? Math.round((checklistCompleted / checklist.length) * 100) : undefined

    const updates: Partial<Trade> = {
      symbol,
      direction,
      side: direction === "BUY" ? "long" : "short",
      lotSize: Number.isFinite(lotNum) ? lotNum : undefined,
      quantity: Number.isFinite(lotNum) ? lotNum : trade.quantity,
      entryPrice: entryNum,
      stopLoss: Number.isFinite(slNum) ? slNum : undefined,
      takeProfit: Number.isFinite(tpNum) ? tpNum : undefined,
      actualProfitLoss: resolvedPL,
      profitLoss: +Number(resolvedPL).toFixed(2),
      balanceImpactApplied: +Number(resolvedPL).toFixed(2),
      status,
      notes: notes || undefined,
      screenshotUrl: screenshotUrl || undefined,
      checklistItems: checklist,
      checklistCompleted,
      checklistScore,
      ...(calc
        ? {
            slDistance: calc.slPips,
            tpDistance: calc.tpPips,
            rrRatio: calc.rrRatio,
            estimatedLoss: calc.estimatedLoss,
            estimatedProfit: calc.estimatedProfit,
          }
        : {}),
    }
    onSave(updates)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-border bg-muted/20 p-4"
      aria-label="Edit trade"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="edit-symbol">Symbol</Label>
          <Select value={symbol} onValueChange={setSymbol}>
            <SelectTrigger id="edit-symbol">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SYMBOL_KEYS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
              {!SYMBOL_KEYS.includes(symbol as never) && symbol ? (
                <SelectItem value={symbol}>{symbol}</SelectItem>
              ) : null}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Direction</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              size="sm"
              variant={direction === "BUY" ? "default" : "outline"}
              className={
                direction === "BUY"
                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                  : ""
              }
              onClick={() => setDirection("BUY")}
            >
              BUY
            </Button>
            <Button
              type="button"
              size="sm"
              variant={direction === "SELL" ? "default" : "outline"}
              className={
                direction === "SELL"
                  ? "border-red-500/40 bg-red-500/15 text-red-300 hover:bg-red-500/25"
                  : ""
              }
              onClick={() => setDirection("SELL")}
            >
              SELL
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-lot">Lot Size</Label>
          <Input
            id="edit-lot"
            type="number"
            inputMode="decimal"
            step="0.01"
            value={lotSize}
            onChange={(e) => setLotSize(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-entry">Entry</Label>
          <Input
            id="edit-entry"
            type="number"
            inputMode="decimal"
            step="any"
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-sl">Stop Loss</Label>
          <Input
            id="edit-sl"
            type="number"
            inputMode="decimal"
            step="any"
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-tp">Take Profit</Label>
          <Input
            id="edit-tp"
            type="number"
            inputMode="decimal"
            step="any"
            value={takeProfit}
            onChange={(e) => setTakeProfit(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-pl">Actual P&amp;L</Label>
          <Input
            id="edit-pl"
            type="number"
            inputMode="decimal"
            step="0.01"
            value={actualPL}
            onChange={(e) => setActualPL(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-status">Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as TradeStatus)}>
            <SelectTrigger id="edit-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {calc ? (
        <div className="flex flex-wrap gap-3 rounded-md border border-border bg-card/60 px-3 py-2 text-xs text-muted-foreground">
          <span>
            RR <span className="font-medium text-sky-400">{calc.rrLabel}</span>
          </span>
          <span>
            SL{" "}
            <span className="font-medium tabular-nums text-foreground">
              {calc.slPips} {calc.pipLabel}
            </span>
          </span>
          <span>
            TP{" "}
            <span className="font-medium tabular-nums text-foreground">
              {calc.tpPips} {calc.pipLabel}
            </span>
          </span>
          <span>
            Est. loss <span className="font-medium tabular-nums text-red-400">-${calc.estimatedLoss}</span>
          </span>
          <span>
            Est. profit{" "}
            <span className="font-medium tabular-nums text-emerald-400">+${calc.estimatedProfit}</span>
          </span>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="edit-notes">Notes</Label>
        <Textarea
          id="edit-notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What happened on this trade?"
        />
      </div>

      {checklist.length > 0 ? (
        <div className="space-y-2">
          <Label>Checklist</Label>
          <ul className="space-y-1.5 rounded-md border border-border bg-card/60 p-3">
            {checklist.map((item) => (
              <li key={item.id} className="flex items-center gap-2">
                <Checkbox
                  id={`edit-cl-${item.id}`}
                  checked={item.checked}
                  onCheckedChange={() => handleChecklistToggle(item.id)}
                />
                <Label htmlFor={`edit-cl-${item.id}`} className="cursor-pointer text-sm font-normal">
                  {item.label}
                </Label>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="edit-screenshot">Screenshot</Label>
        <div className="flex flex-wrap items-center gap-3">
          <Input
            id="edit-screenshot"
            type="file"
            accept="image/png,image/jpeg"
            onChange={(e) => handleScreenshot(e.target.files?.[0])}
            className="max-w-xs"
          />
          {screenshotUrl ? (
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={screenshotUrl || "/placeholder.svg"}
                alt="Trade screenshot preview"
                className="size-12 rounded-md border border-border object-cover"
              />
              <Button type="button" size="sm" variant="ghost" onClick={() => setScreenshotUrl("")}>
                Remove
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          <X className="mr-1.5 size-3.5" />
          Cancel
        </Button>
        <Button type="submit" size="sm">
          <Save className="mr-1.5 size-3.5" />
          Save changes
        </Button>
      </div>
    </form>
  )
}
