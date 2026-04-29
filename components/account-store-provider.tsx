"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { type Account, MAX_ACCOUNTS, newAccountId } from "@/lib/accounts"

const ACCOUNTS_STORAGE_KEY = "tj.accounts.v1"
const SELECTION_STORAGE_KEY = "tj.account_selection.v1"

type StoredAccount = Omit<Account, "createdAt" | "updatedAt"> & {
  createdAt: string
  updatedAt: string
}

export type AccountStoreContextValue = {
  accounts: Account[]
  /** null means "All Accounts". An array means filter to those ids. */
  selectedAccountIds: string[] | null
  isHydrated: boolean
  canCreate: boolean
  createAccount: (input: Omit<Account, "id" | "createdAt" | "updatedAt">) => Account | null
  updateAccount: (id: string, updates: Partial<Account>) => void
  deleteAccount: (id: string) => void
  setSelection: (ids: string[] | null) => void
  toggleSelected: (id: string) => void
  selectAll: () => void
}

const AccountStoreContext = createContext<AccountStoreContextValue | null>(null)

function loadAccounts(): Account[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as StoredAccount[]
    return parsed.map((a) => ({
      ...a,
      createdAt: new Date(a.createdAt),
      updatedAt: new Date(a.updatedAt),
    }))
  } catch {
    return []
  }
}

function persistAccounts(accounts: Account[]) {
  if (typeof window === "undefined") return
  try {
    const serializable: StoredAccount[] = accounts.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    }))
    window.localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(serializable))
  } catch (err) {
    console.log("[v0] Failed to persist accounts:", (err as Error).message)
  }
}

function loadSelection(): string[] | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(SELECTION_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed === null) return null
    if (Array.isArray(parsed)) return parsed.filter((x) => typeof x === "string")
    return null
  } catch {
    return null
  }
}

function persistSelection(selection: string[] | null) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(SELECTION_STORAGE_KEY, JSON.stringify(selection))
  } catch (err) {
    console.log("[v0] Failed to persist selection:", (err as Error).message)
  }
}

export function AccountStoreProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[] | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setAccounts(loadAccounts())
    setSelectedAccountIds(loadSelection())
    setIsHydrated(true)
  }, [])

  const createAccount = useCallback(
    (input: Omit<Account, "id" | "createdAt" | "updatedAt">) => {
      let created: Account | null = null
      setAccounts((prev) => {
        if (prev.length >= MAX_ACCOUNTS) return prev
        const now = new Date()
        const account: Account = {
          ...input,
          id: newAccountId(),
          createdAt: now,
          updatedAt: now,
        }
        created = account
        const next = [...prev, account]
        persistAccounts(next)
        return next
      })
      return created
    },
    [],
  )

  const updateAccount = useCallback((id: string, updates: Partial<Account>) => {
    setAccounts((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, ...updates, id, updatedAt: new Date() } : a))
      persistAccounts(next)
      return next
    })
  }, [])

  const deleteAccount = useCallback((id: string) => {
    setAccounts((prev) => {
      const next = prev.filter((a) => a.id !== id)
      persistAccounts(next)
      return next
    })
    setSelectedAccountIds((prev) => {
      if (prev === null) return prev
      const next = prev.filter((x) => x !== id)
      persistSelection(next.length === 0 ? null : next)
      return next.length === 0 ? null : next
    })
  }, [])

  const setSelection = useCallback((ids: string[] | null) => {
    setSelectedAccountIds(ids)
    persistSelection(ids)
  }, [])

  const toggleSelected = useCallback(
    (id: string) => {
      setSelectedAccountIds((prev) => {
        // From "All" -> deselect just this id (selection becomes everything except this one).
        if (prev === null) {
          const next = accounts.map((a) => a.id).filter((x) => x !== id)
          persistSelection(next.length === 0 ? [] : next)
          return next.length === 0 ? [] : next
        }
        const has = prev.includes(id)
        const next = has ? prev.filter((x) => x !== id) : [...prev, id]
        // If toggling produced "all selected", collapse back to null sentinel.
        const allIds = accounts.map((a) => a.id)
        const isAll = next.length === allIds.length && allIds.every((x) => next.includes(x))
        const finalSelection = isAll ? null : next
        persistSelection(finalSelection)
        return finalSelection
      })
    },
    [accounts],
  )

  const selectAll = useCallback(() => {
    setSelection(null)
  }, [setSelection])

  const canCreate = accounts.length < MAX_ACCOUNTS

  const value = useMemo<AccountStoreContextValue>(
    () => ({
      accounts,
      selectedAccountIds,
      isHydrated,
      canCreate,
      createAccount,
      updateAccount,
      deleteAccount,
      setSelection,
      toggleSelected,
      selectAll,
    }),
    [
      accounts,
      selectedAccountIds,
      isHydrated,
      canCreate,
      createAccount,
      updateAccount,
      deleteAccount,
      setSelection,
      toggleSelected,
      selectAll,
    ],
  )

  return <AccountStoreContext.Provider value={value}>{children}</AccountStoreContext.Provider>
}

export function useAccountStore(): AccountStoreContextValue {
  const ctx = useContext(AccountStoreContext)
  if (!ctx) throw new Error("useAccountStore must be used inside <AccountStoreProvider>")
  return ctx
}
