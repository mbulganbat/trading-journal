"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, BookOpen, Calculator, Plus, Save, Wallet, Wand2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { LivePreview } from "@/components/trade-form/live-preview"
import { ScreenshotUpload } from "@/components/trade-form/screenshot-upload"
import { SetupChecklist } from "@/components/trade-form/setup-checklist"
import { useAccountStore } from "@/components/account-store-provider"
import { useTradeStore } from "@/components/trade-store-provider"
import { calcTrade, checklistStatus, reverseCalc, validatePrices } from "@/lib/trade-calculator"
import {
  type ChecklistItem,
  type Trade,
  type TradeDirection,
  type TradeEmotion,
  type TradeSession,
  type TradeStrategy,
} from "@/lib/mock-trades"
import { SYMBOL_CONFIGS, SYMBOL_KEYS, type SymbolKey } from "@/lib/symbols"

type Mode = "standard" | "reverse"

const SESSIONS: TradeSession[] = ["Asia", "London", "New York"]
const STRATEGIES: TradeStrategy[] = ["SMC", "ICT", "Price Action", "Breakout", "Indicator"]
const EMOTIONS: TradeEmotion[] = ["Calm", "Fear", "Greedy", "Confident", "FOMO"]
const MISTAKE_OPTIONS = [
  "No stop loss",
  "Moved stop loss",
  "Overtraded",
  "Revenge trade",
  "FOMO entry",
  "Ignored plan",
  "Wrong session",
  "Oversized",
]

type Props = {
  initialMode?: "trade" | "journal"
}

export function NewTradeForm({ initialMode = "trade" }: Props) {
  const router = useRouter()
  const { addTrade } = useTradeStore()
  const { accounts, isHydrated: accountsHydrated } = useAccountStore()

  const [mode, setMode] = useState<Mode>("standard")
  const [accountId, setAccountId] = useState<string>("")
  const [symbol, setSymbol] = useState<SymbolKey>("XAUUSD")
  const [direction, setDirection] = useState<TradeDirection>("BUY")

  const [entry, setEntry] = useState("")
  const [stopLoss, setStopLoss] = useState("")
  const [takeProfit, setTakeProfit] = useState("")
  const [lotSize, setLotSize] = useState("0.10")

  // Standard-mode money inputs
  const [riskAmount, setRiskAmount] = useState("")
  const [riskPercent, setRiskPercent] = useState("1")

  // Reverse-mode inputs
  const [accountBalance, setAccountBalance] = useState("10000")
  const [desiredRR, setDesiredRR] = useState("2")

  const [session, setSession] = useState<TradeSession>("London")
  const [strategy, setStrategy] = useState<TradeStrategy>("SMC")
  const [emotion, setEmotion] = useState<TradeEmotion>("Calm")
  const [mistakes, setMistakes] = useState<string[]>([])
  const [notes, setNotes] = useState("")
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: "seed-1", label: "Liquidity sweep", checked: false },
    { id: "seed-2", label: "FVG present", checked: false },
    { id: "seed-3", label: "Structure break", checked: false },
    { id: "seed-4", label: "Session confirmation", checked: false },
    { id: "seed-5", label: "Entry confirmation", checked: false },
  ])
  const [screenshot, setScreenshot] = useState<string | null>(null)

  // Default to the first account (or keep selection if it still exists).
  useEffect(() => {
    if (!accountsHydrated) return
    if (accounts.length === 0) {
      setAccountId("")
      return
    }
    setAccountId((prev) => {
      if (prev && accounts.some((a) => a.id === prev)) return prev
      return accounts[0].id
    })
  }, [accounts, accountsHydrated])

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === accountId) ?? null,
    [accounts, accountId],
  )

  const entryNum = parseFloat(entry)
  const slNum = parseFloat(stopLoss)
  const tpNum = parseFloat(takeProfit)
  const lotNum = parseFloat(lotSize)

  // In reverse mode, we auto-derive TP / lot from balance + risk%.
  const reverse = useMemo(() => {
    if (mode !== "reverse") return null
    const balance = parseFloat(accountBalance)
    const rPct = parseFloat(riskPercent)
    const rr = parseFloat(desiredRR)
    if (!Number.isFinite(balance) || !Number.isFinite(rPct) || !Number.isFinite(rr)) return null
    if (!Number.isFinite(entryNum) || !Number.isFinite(slNum)) return null
    return reverseCalc({
      symbol,
      direction,
      accountBalance: balance,
      riskPercent: rPct,
      entry: entryNum,
      stopLoss: slNum,
      desiredRR: rr,
    })
  }, [mode, accountBalance, riskPercent, desiredRR, entryNum, slNum, symbol, direction])

  // Sync derived TP / lot back into the form when reverse mode is active.
  useEffect(() => {
    if (mode !== "reverse" || !reverse) return
    if (Number.isFinite(reverse.takeProfit) && reverse.takeProfit > 0) {
      setTakeProfit(reverse.takeProfit.toFixed(SYMBOL_CONFIGS[symbol].decimals))
    }
    if (Number.isFinite(reverse.lotSize) && reverse.lotSize > 0) {
      setLotSize(reverse.lotSize.toFixed(2))
    }
    if (Number.isFinite(reverse.riskAmount) && reverse.riskAmount > 0) {
      setRiskAmount(reverse.riskAmount.toFixed(2))
    }
  }, [reverse, mode, symbol])

  const validation = useMemo(() => {
    if (![entryNum, slNum, tpNum].every(Number.isFinite)) return { ok: true, message: null as string | null }
    return validatePrices(direction, entryNum, slNum, tpNum)
  }, [direction, entryNum, slNum, tpNum])

  const calc = useMemo(
    () =>
      calcTrade({
        symbol,
        direction,
        entry: entryNum,
        stopLoss: slNum,
        takeProfit: tpNum,
        lotSize: Number.isFinite(lotNum) ? lotNum : 0,
      }),
    [symbol, direction, entryNum, slNum, tpNum, lotNum],
  )

  const effectiveRiskAmount = useMemo(() => {
    const r = parseFloat(riskAmount)
    if (Number.isFinite(r) && r > 0) return r
    if (mode === "reverse" && reverse) return reverse.riskAmount
    return calc.estimatedLoss
  }, [riskAmount, mode, reverse, calc.estimatedLoss])

  const toggleMistake = (m: string) => {
    setMistakes((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedAccount) {
      toast.error("Select an account before saving this trade.")
      return
    }
    if (!Number.isFinite(entryNum) || !Number.isFinite(slNum) || !Number.isFinite(tpNum)) {
      toast.error("Please fill in Entry, Stop Loss and Take Profit.")
      return
    }
    if (!validation.ok) {
      toast.error(validation.message ?? "Price levels are invalid for this direction.")
      return
    }
    if (!Number.isFinite(lotNum) || lotNum <= 0) {
      toast.error("Lot size must be greater than zero.")
      return
    }

    const status = checklistStatus(checklist)
    const now = new Date()
    const id = `usr_${now.getTime()}_${Math.floor(Math.random() * 1e6)}`

    // Use estimated profit/loss as the actual P/L for journal display until the trade is closed.
    const actualPL = calc.estimatedProfit // optimistic placeholder; real fill comes later

    const trade: Trade = {
      id,
      symbol,
      side: direction === "BUY" ? "long" : "short",
      direction,
      account: selectedAccount.accountName,
      accountId: selectedAccount.id,
      quantity: Math.max(1, Math.round(lotNum * 100)), // legacy field, derived from lots
      entryPrice: entryNum,
      exitPrice: tpNum,
      profitLoss: actualPL,
      createdAt: now,
      updatedAt: now,
      stopLoss: slNum,
      takeProfit: tpNum,
      lotSize: lotNum,
      riskAmount: effectiveRiskAmount,
      riskPercent: parseFloat(riskPercent) || 0,
      rewardAmount: calc.estimatedProfit,
      rrRatio: calc.rrRatio,
      slDistance: calc.slPips,
      tpDistance: calc.tpPips,
      estimatedLoss: calc.estimatedLoss,
      estimatedProfit: calc.estimatedProfit,
      actualProfitLoss: actualPL,
      session,
      strategy,
      emotion,
      mistakes,
      notes,
      checklistItems: checklist,
      checklistCompleted: status.completed,
      checklistScore: status.score,
      screenshotUrl: screenshot ?? undefined,
      isJournal: initialMode === "journal",
    }

    addTrade(trade)
    toast.success(initialMode === "journal" ? "Journal entry saved." : "Trade saved.", {
      description: `${symbol} ${direction} • ${calc.rrLabel} RR`,
    })
    router.push("/app")
  }

  // Hard requirement: at least one account must exist before saving a trade or journal entry.
  if (accountsHydrated && accounts.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Wallet className="size-5" aria-hidden />
              </EmptyMedia>
              <EmptyTitle>Create an account first</EmptyTitle>
              <EmptyDescription>
                Every {initialMode === "journal" ? "journal entry" : "trade"} must be linked to an account.
                Set up your first account, then come back to log trades.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400">
                  <Link href="/accounts">
                    <Plus className="size-4" aria-hidden />
                    Create account
                  </Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link href="/app">
                    <ArrowLeft className="size-4" aria-hidden />
                    Back to dashboard
                  </Link>
                </Button>
              </div>
            </EmptyContent>
          </Empty>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      {/* LEFT: form sections */}
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold">Trade Setup</CardTitle>
              <p className="text-xs text-muted-foreground">Account, symbol, and direction</p>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5">
              <Calculator className="size-3.5 text-muted-foreground" aria-hidden />
              <Label htmlFor="reverse-toggle" className="text-xs font-medium">
                Reverse calculator
              </Label>
              <Switch
                id="reverse-toggle"
                checked={mode === "reverse"}
                onCheckedChange={(c) => setMode(c ? "reverse" : "standard")}
              />
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 p-5 sm:grid-cols-3">
            <FieldBlock label="Account" hint="required">
              <Select value={accountId} onValueChange={setAccountId} disabled={accounts.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder={accounts.length === 0 ? "No accounts" : "Select account"} />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.accountName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldBlock>
            <FieldBlock label="Symbol">
              <Select value={symbol} onValueChange={(v) => setSymbol(v as SymbolKey)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SYMBOL_KEYS.map((key) => (
                    <SelectItem key={key} value={key}>
                      {SYMBOL_CONFIGS[key].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldBlock>
            <FieldBlock label="Direction">
              <div className="grid grid-cols-2 gap-2">
                <DirectionButton active={direction === "BUY"} tone="win" onClick={() => setDirection("BUY")}>
                  BUY
                </DirectionButton>
                <DirectionButton active={direction === "SELL"} tone="loss" onClick={() => setDirection("SELL")}>
                  SELL
                </DirectionButton>
              </div>
            </FieldBlock>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-base font-semibold">Prices &amp; Position</CardTitle>
            <p className="text-xs text-muted-foreground">
              {mode === "reverse"
                ? "We'll calculate Take Profit and Lot Size from your risk parameters."
                : "Enter your entry, stop loss, and take profit levels."}
            </p>
          </CardHeader>
          <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
            <FieldBlock label={`Entry Price (${SYMBOL_CONFIGS[symbol].pipLabel})`}>
              <Input
                inputMode="decimal"
                value={entry}
                onChange={(e) => setEntry(e.target.value)}
                placeholder="0.00"
              />
            </FieldBlock>
            <FieldBlock label="Stop Loss">
              <Input
                inputMode="decimal"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="0.00"
              />
            </FieldBlock>
            <FieldBlock label="Take Profit" hint={mode === "reverse" ? "auto" : undefined}>
              <Input
                inputMode="decimal"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                placeholder="0.00"
                disabled={mode === "reverse"}
              />
            </FieldBlock>
            <FieldBlock label="Lot Size" hint={mode === "reverse" ? "auto" : undefined}>
              <Input
                inputMode="decimal"
                value={lotSize}
                onChange={(e) => setLotSize(e.target.value)}
                placeholder="0.10"
                disabled={mode === "reverse"}
              />
            </FieldBlock>

            {mode === "standard" ? (
              <>
                <FieldBlock label="Risk %">
                  <Input
                    inputMode="decimal"
                    value={riskPercent}
                    onChange={(e) => setRiskPercent(e.target.value)}
                    placeholder="1"
                  />
                </FieldBlock>
                <FieldBlock label="Risk Amount ($)" hint="optional">
                  <Input
                    inputMode="decimal"
                    value={riskAmount}
                    onChange={(e) => setRiskAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </FieldBlock>
              </>
            ) : (
              <>
                <FieldBlock label="Account Balance ($)">
                  <Input
                    inputMode="decimal"
                    value={accountBalance}
                    onChange={(e) => setAccountBalance(e.target.value)}
                    placeholder="10000"
                  />
                </FieldBlock>
                <FieldBlock label="Risk %">
                  <Input
                    inputMode="decimal"
                    value={riskPercent}
                    onChange={(e) => setRiskPercent(e.target.value)}
                    placeholder="1"
                  />
                </FieldBlock>
                <FieldBlock label="Desired RR">
                  <Input
                    inputMode="decimal"
                    value={desiredRR}
                    onChange={(e) => setDesiredRR(e.target.value)}
                    placeholder="2"
                  />
                </FieldBlock>
                <FieldBlock label="Risk Amount ($)" hint="auto">
                  <Input value={riskAmount} disabled placeholder="—" />
                </FieldBlock>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-base font-semibold">Context</CardTitle>
            <p className="text-xs text-muted-foreground">Session, strategy, emotion</p>
          </CardHeader>
          <CardContent className="grid gap-4 p-5 sm:grid-cols-3">
            <FieldBlock label="Session">
              <Select value={session} onValueChange={(v) => setSession(v as TradeSession)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SESSIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldBlock>
            <FieldBlock label="Strategy">
              <Select value={strategy} onValueChange={(v) => setStrategy(v as TradeStrategy)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STRATEGIES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldBlock>
            <FieldBlock label="Emotion">
              <Select value={emotion} onValueChange={(v) => setEmotion(v as TradeEmotion)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMOTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldBlock>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-base font-semibold">Mistakes &amp; Notes</CardTitle>
            <p className="text-xs text-muted-foreground">Tag mistakes and add a written reflection</p>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <div className="flex flex-wrap gap-1.5">
              {MISTAKE_OPTIONS.map((m) => {
                const active = mistakes.includes(m)
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => toggleMistake(m)}
                    className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                      active
                        ? "border-red-500/40 bg-red-500/15 text-red-300"
                        : "border-border bg-card text-muted-foreground hover:border-red-500/30 hover:text-red-300"
                    }`}
                  >
                    {m}
                  </button>
                )
              })}
            </div>
            <Separator />
            <FieldBlock label="Notes">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What went well? What would you change?"
                rows={4}
              />
            </FieldBlock>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-base font-semibold">Setup Checklist</CardTitle>
            <p className="text-xs text-muted-foreground">Track how well this trade follows your rules</p>
          </CardHeader>
          <CardContent className="p-5">
            <SetupChecklist items={checklist} onChange={setChecklist} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-base font-semibold">Screenshot</CardTitle>
            <p className="text-xs text-muted-foreground">Attach a chart screenshot for reference</p>
          </CardHeader>
          <CardContent className="p-5">
            <ScreenshotUpload value={screenshot} onChange={setScreenshot} />
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button asChild type="button" variant="ghost">
            <Link href="/app">
              <ArrowLeft className="size-4" aria-hidden />
              Back to dashboard
            </Link>
          </Button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" size="lg" className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400">
              {initialMode === "journal" ? (
                <>
                  <BookOpen className="size-4" aria-hidden />
                  Save Journal
                </>
              ) : (
                <>
                  <Save className="size-4" aria-hidden />
                  Save Trade
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* RIGHT: live preview (sticky) */}
      <div>
        <LivePreview
          symbol={symbol}
          direction={direction}
          entry={entryNum}
          stopLoss={slNum}
          takeProfit={tpNum}
          lotSize={Number.isFinite(lotNum) ? lotNum : 0}
          riskAmount={effectiveRiskAmount}
          calc={calc}
          checklist={checklist}
          validationError={validation.message}
        />
        {mode === "reverse" ? (
          <div className="mt-3 flex items-center gap-2 rounded-md border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs text-sky-300">
            <Wand2 className="size-3.5" aria-hidden />
            Reverse mode: TP &amp; lot size are auto-calculated.
          </div>
        ) : null}
      </div>
    </form>
  )
}

function FieldBlock({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</Label>
        {hint ? (
          <Badge variant="outline" className="border-border bg-muted/30 px-1.5 py-0 text-[10px] font-medium">
            {hint}
          </Badge>
        ) : null}
      </div>
      {children}
    </div>
  )
}

function DirectionButton({
  active,
  tone,
  onClick,
  children,
}: {
  active: boolean
  tone: "win" | "loss"
  onClick: () => void
  children: React.ReactNode
}) {
  const activeClass =
    tone === "win"
      ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
      : "border-red-500/50 bg-red-500/15 text-red-300"
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-3 py-2 text-sm font-semibold transition-all ${
        active ? activeClass : "border-border bg-card text-muted-foreground hover:bg-muted/50"
      }`}
    >
      {children}
    </button>
  )
}
