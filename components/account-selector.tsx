"use client"

import Link from "next/link"
import { Check, ChevronDown, Plus, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useAccountStore } from "@/components/account-store-provider"

export function AccountSelector() {
  const { accounts, selectedAccountIds, isHydrated, selectAll, toggleSelected } = useAccountStore()

  const allSelected = selectedAccountIds === null
  const selectedCount = allSelected ? accounts.length : selectedAccountIds!.length

  const triggerLabel = (() => {
    if (!isHydrated) return "Accounts"
    if (accounts.length === 0) return "No accounts"
    if (allSelected) return "All accounts"
    if (selectedCount === 0) return "No accounts selected"
    if (selectedCount === 1) {
      const id = selectedAccountIds![0]
      const account = accounts.find((a) => a.id === id)
      return account?.accountName ?? "1 account"
    }
    return `${selectedCount} accounts`
  })()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Wallet className="size-4" aria-hidden />
          <span className="max-w-[160px] truncate">{triggerLabel}</span>
          {accounts.length > 0 && !allSelected && selectedCount > 0 ? (
            <Badge variant="outline" className="border-border bg-muted/40 px-1.5 py-0 text-[10px]">
              {selectedCount}
            </Badge>
          ) : null}
          <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Filter by account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {accounts.length === 0 ? (
          <DropdownMenuItem asChild>
            <Link href="/accounts" className="flex items-center gap-2">
              <Plus className="size-3.5" aria-hidden />
              Create your first account
            </Link>
          </DropdownMenuItem>
        ) : (
          <>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                selectAll()
              }}
              className="flex items-center justify-between"
            >
              <span>All accounts</span>
              {allSelected ? <Check className="size-3.5 text-emerald-400" aria-hidden /> : null}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {accounts.map((account) => {
              const checked = allSelected || (selectedAccountIds?.includes(account.id) ?? false)
              return (
                <DropdownMenuCheckboxItem
                  key={account.id}
                  checked={checked}
                  onCheckedChange={() => toggleSelected(account.id)}
                  onSelect={(e) => e.preventDefault()}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="truncate">{account.accountName}</span>
                    <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {account.accountType}
                    </span>
                  </div>
                </DropdownMenuCheckboxItem>
              )
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/accounts" className="flex items-center gap-2">
                <Plus className="size-3.5" aria-hidden />
                Manage accounts
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
