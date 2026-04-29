"use client"

import { useMemo, useState } from "react"
import { Building2, Pencil, Plus, Trash2, Wallet } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { useAccountStore } from "@/components/account-store-provider"
import { useTradeStore } from "@/components/trade-store-provider"
import { AccountForm } from "@/components/accounts/account-form"
import {
  type Account,
  closedPLForAccount,
  effectiveBalance,
  formatAccountCurrency,
  MAX_ACCOUNTS,
} from "@/lib/accounts"

const TYPE_TONE: Record<Account["accountType"], string> = {
  Demo: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  Challenge: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  Funded: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  Live: "border-violet-500/30 bg-violet-500/10 text-violet-300",
}

export function AccountsList() {
  const { accounts, canCreate, createAccount, updateAccount, deleteAccount } = useAccountStore()
  const { trades } = useTradeStore()

  const [formOpen, setFormOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null)

  const tradeCounts = useMemo(() => {
    const m = new Map<string, number>()
    for (const t of trades) {
      if (!t.accountId) continue
      m.set(t.accountId, (m.get(t.accountId) ?? 0) + 1)
    }
    return m
  }, [trades])

  function handleCreateClick() {
    if (!canCreate) {
      toast.error("Maximum 10 accounts allowed.")
      return
    }
    setEditingAccount(null)
    setFormOpen(true)
  }

  function handleEdit(account: Account) {
    setEditingAccount(account)
    setFormOpen(true)
  }

  function handleSubmit(input: Omit<Account, "id" | "createdAt" | "updatedAt">) {
    if (editingAccount) {
      updateAccount(editingAccount.id, input)
      toast.success("Account updated", { description: input.accountName })
      setFormOpen(false)
      setEditingAccount(null)
      return
    }
    if (!canCreate) {
      toast.error("Maximum 10 accounts allowed.")
      return
    }
    const created = createAccount(input)
    if (!created) {
      toast.error("Maximum 10 accounts allowed.")
      return
    }
    toast.success("Account created", { description: created.accountName })
    setFormOpen(false)
  }

  function handleDelete() {
    if (!deletingAccount) return
    deleteAccount(deletingAccount.id)
    toast.success("Account deleted", { description: deletingAccount.accountName })
    setDeletingAccount(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
          <p className="text-sm text-muted-foreground">
            Manage your trading accounts. {accounts.length} of {MAX_ACCOUNTS} used.
          </p>
        </div>
        <Button
          onClick={handleCreateClick}
          disabled={!canCreate}
          className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
          size="sm"
        >
          <Plus className="size-4" aria-hidden />
          New account
        </Button>
      </div>

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Wallet className="size-5" aria-hidden />
                </EmptyMedia>
                <EmptyTitle>No accounts yet</EmptyTitle>
                <EmptyDescription>
                  Create your first account to start logging trades and tracking balance.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={handleCreateClick} className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400">
                  <Plus className="size-4" aria-hidden />
                  Create account
                </Button>
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {accounts.map((account) => {
            const balance = effectiveBalance(account, trades)
            const closedPL = closedPLForAccount(account.id, trades)
            const plPositive = closedPL > 0
            const plNegative = closedPL < 0
            const tradeCount = tradeCounts.get(account.id) ?? 0
            return (
              <Card key={account.id} className="transition-shadow hover:shadow-md">
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-base font-semibold tracking-tight">
                          {account.accountName}
                        </span>
                        <Badge variant="outline" className={TYPE_TONE[account.accountType]}>
                          {account.accountType}
                        </Badge>
                        <Badge variant="outline" className="border-border bg-muted/40 text-muted-foreground">
                          {account.balanceMode}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Building2 className="size-3.5" aria-hidden />
                        <span className="truncate">{account.brokerPlatform}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(account)}
                        aria-label={`Edit ${account.accountName}`}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingAccount(account)}
                        aria-label={`Delete ${account.accountName}`}
                        className="text-muted-foreground hover:bg-red-500/10 hover:text-red-400"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 rounded-lg border border-border bg-muted/30 p-3">
                    <Stat label="Current" value={formatAccountCurrency(balance, account.currency)} />
                    <Stat
                      label="Starting"
                      value={formatAccountCurrency(account.startingBalance, account.currency)}
                      muted
                    />
                    <Stat
                      label="Closed P&L"
                      value={formatAccountCurrency(closedPL, account.currency, { signed: true })}
                      tone={plPositive ? "win" : plNegative ? "loss" : "neutral"}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {tradeCount} {tradeCount === 1 ? "trade" : "trades"}
                    </span>
                    <span>Updated {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(account.updatedAt)}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <AccountForm
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o)
          if (!o) setEditingAccount(null)
        }}
        account={editingAccount}
        onSubmit={handleSubmit}
      />

      <AlertDialog
        open={deletingAccount !== null}
        onOpenChange={(o) => {
          if (!o) setDeletingAccount(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this account?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingAccount
                ? `"${deletingAccount.accountName}" will be removed. Trades linked to this account remain in your journal but will no longer be filterable by it.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 text-white hover:bg-red-500/90 focus:ring-red-500"
            >
              Delete account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function Stat({
  label,
  value,
  tone = "neutral",
  muted = false,
}: {
  label: string
  value: string
  tone?: "win" | "loss" | "neutral"
  muted?: boolean
}) {
  const valueClass =
    tone === "win"
      ? "text-emerald-400"
      : tone === "loss"
        ? "text-red-400"
        : muted
          ? "text-muted-foreground"
          : "text-foreground"
  return (
    <div className="space-y-0.5">
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-sm font-semibold tabular-nums ${valueClass}`}>{value}</div>
    </div>
  )
}
