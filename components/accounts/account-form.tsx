"use client"

import { useEffect, useMemo, useState } from "react"
import { Save, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ACCOUNT_TYPES,
  type Account,
  type AccountType,
  type BalanceMode,
  CURRENCY_OPTIONS,
  type Currency,
  closedPLForAccount,
  formatAccountCurrency,
} from "@/lib/accounts"
import { useTradeStore } from "@/components/trade-store-provider"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When provided, the form is in edit mode. */
  account?: Account | null
  onSubmit: (input: Omit<Account, "id" | "createdAt" | "updatedAt">) => void
}

const DEFAULTS = {
  accountName: "",
  brokerPlatform: "",
  accountType: "Demo" as AccountType,
  startingBalance: "10000",
  currentBalance: "10000",
  currency: "USD" as Currency,
  balanceMode: "Auto" as BalanceMode,
}

export function AccountForm({ open, onOpenChange, account, onSubmit }: Props) {
  const { trades } = useTradeStore()
  const isEdit = !!account

  const [accountName, setAccountName] = useState(DEFAULTS.accountName)
  const [brokerPlatform, setBrokerPlatform] = useState(DEFAULTS.brokerPlatform)
  const [accountType, setAccountType] = useState<AccountType>(DEFAULTS.accountType)
  const [startingBalance, setStartingBalance] = useState(DEFAULTS.startingBalance)
  const [currentBalance, setCurrentBalance] = useState(DEFAULTS.currentBalance)
  const [currency, setCurrency] = useState<Currency>(DEFAULTS.currency)
  const [balanceMode, setBalanceMode] = useState<BalanceMode>(DEFAULTS.balanceMode)

  // Reset form when opening or switching account.
  useEffect(() => {
    if (!open) return
    if (account) {
      setAccountName(account.accountName)
      setBrokerPlatform(account.brokerPlatform)
      setAccountType(account.accountType)
      setStartingBalance(String(account.startingBalance))
      setCurrentBalance(String(account.currentBalance))
      setCurrency(account.currency)
      setBalanceMode(account.balanceMode)
    } else {
      setAccountName(DEFAULTS.accountName)
      setBrokerPlatform(DEFAULTS.brokerPlatform)
      setAccountType(DEFAULTS.accountType)
      setStartingBalance(DEFAULTS.startingBalance)
      setCurrentBalance(DEFAULTS.currentBalance)
      setCurrency(DEFAULTS.currency)
      setBalanceMode(DEFAULTS.balanceMode)
    }
  }, [open, account])

  const startingNum = Number.parseFloat(startingBalance)
  const currentNum = Number.parseFloat(currentBalance)

  // Auto-mode preview balance: starting + closed P&L for this account.
  const autoPreview = useMemo(() => {
    if (balanceMode !== "Auto") return null
    const closed = isEdit ? closedPLForAccount(account!.id, trades) : 0
    if (!Number.isFinite(startingNum)) return null
    return +(startingNum + closed).toFixed(2)
  }, [balanceMode, isEdit, account, trades, startingNum])

  // When Auto is selected, mirror startingBalance + closed P&L into currentBalance.
  useEffect(() => {
    if (balanceMode !== "Auto") return
    if (autoPreview === null) return
    setCurrentBalance(autoPreview.toFixed(2))
  }, [balanceMode, autoPreview])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!accountName.trim()) {
      toast.error("Account name is required.")
      return
    }
    if (!brokerPlatform.trim()) {
      toast.error("Broker / platform is required.")
      return
    }
    if (!Number.isFinite(startingNum) || startingNum < 0) {
      toast.error("Starting balance must be a positive number.")
      return
    }
    const resolvedCurrent =
      balanceMode === "Auto"
        ? (autoPreview ?? startingNum)
        : Number.isFinite(currentNum)
          ? currentNum
          : startingNum

    onSubmit({
      accountName: accountName.trim(),
      brokerPlatform: brokerPlatform.trim(),
      accountType,
      startingBalance: +startingNum.toFixed(2),
      currentBalance: +resolvedCurrent.toFixed(2),
      currency,
      balanceMode,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit account" : "Create account"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this account's details. Trades stay associated with the account."
              : "Add a brokerage or prop-firm account to track its balance and trades."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="acc-name">Account name</Label>
            <Input
              id="acc-name"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="FTMO Challenge #1"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="acc-broker">Broker / platform</Label>
            <Input
              id="acc-broker"
              value={brokerPlatform}
              onChange={(e) => setBrokerPlatform(e.target.value)}
              placeholder="MetaTrader 5, FTMO, Interactive Brokers..."
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="acc-type">Account type</Label>
              <Select value={accountType} onValueChange={(v) => setAccountType(v as AccountType)}>
                <SelectTrigger id="acc-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="acc-currency">Currency</Label>
              <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                <SelectTrigger id="acc-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="acc-start">Starting balance</Label>
              <Input
                id="acc-start"
                type="number"
                inputMode="decimal"
                step="0.01"
                value={startingBalance}
                onChange={(e) => setStartingBalance(e.target.value)}
                placeholder="10000"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="acc-current">
                Current balance
                {balanceMode === "Auto" ? (
                  <span className="ml-1 text-[10px] font-normal uppercase tracking-wide text-muted-foreground">
                    auto
                  </span>
                ) : null}
              </Label>
              <Input
                id="acc-current"
                type="number"
                inputMode="decimal"
                step="0.01"
                value={currentBalance}
                onChange={(e) => setCurrentBalance(e.target.value)}
                disabled={balanceMode === "Auto"}
                placeholder="10000"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2.5">
            <div className="space-y-0.5">
              <div className="text-sm font-medium">Auto balance</div>
              <p className="text-xs text-muted-foreground">
                {balanceMode === "Auto"
                  ? "Balance updates automatically as trades are closed."
                  : "Balance is edited manually."}
              </p>
            </div>
            <Switch
              checked={balanceMode === "Auto"}
              onCheckedChange={(c) => setBalanceMode(c ? "Auto" : "Manual")}
              aria-label="Toggle auto balance"
            />
          </div>

          {balanceMode === "Auto" && autoPreview !== null ? (
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
              Computed balance: {formatAccountCurrency(autoPreview, currency)}
            </div>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              <X className="mr-1.5 size-3.5" />
              Cancel
            </Button>
            <Button type="submit">
              <Save className="mr-1.5 size-3.5" />
              {isEdit ? "Save changes" : "Create account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
