"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import type { ChecklistItem } from "@/lib/mock-trades"
import { checklistStatus } from "@/lib/trade-calculator"

type Props = {
  items: ChecklistItem[]
  onChange: (items: ChecklistItem[]) => void
}

const SUGGESTIONS = [
  "Liquidity sweep",
  "FVG present",
  "Structure break",
  "Session confirmation",
  "Entry confirmation",
]

export function SetupChecklist({ items, onChange }: Props) {
  const [draft, setDraft] = useState("")
  const status = checklistStatus(items)

  const addItem = (label: string) => {
    const trimmed = label.trim()
    if (!trimmed) return
    const id = `cl_${Date.now()}_${Math.floor(Math.random() * 1e6)}`
    onChange([...items, { id, label: trimmed, checked: false }])
    setDraft("")
  }

  const toggle = (id: string) => {
    onChange(items.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)))
  }

  const remove = (id: string) => {
    onChange(items.filter((i) => i.id !== id))
  }

  const remainingSuggestions = SUGGESTIONS.filter(
    (s) => !items.some((i) => i.label.toLowerCase() === s.toLowerCase()),
  )

  const barColor =
    status.tone === "green"
      ? "bg-emerald-500"
      : status.tone === "yellow"
        ? "bg-amber-400"
        : status.tone === "red"
          ? "bg-red-500"
          : "bg-muted-foreground/40"

  const labelColor =
    status.tone === "green"
      ? "text-emerald-400"
      : status.tone === "yellow"
        ? "text-amber-400"
        : status.tone === "red"
          ? "text-red-400"
          : "text-muted-foreground"

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-muted-foreground">
            {status.completed} / {status.total} checked
          </span>
          <span className={`font-semibold ${labelColor}`}>
            {status.label} {status.total > 0 ? `• ${status.score}%` : ""}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted/50">
          <div
            className={`h-full transition-all duration-300 ${barColor}`}
            style={{ width: `${status.score}%` }}
            aria-hidden
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              addItem(draft)
            }
          }}
          placeholder="Add a checklist item…"
          aria-label="New checklist item"
        />
        <Button type="button" variant="outline" onClick={() => addItem(draft)}>
          <Plus className="size-4" aria-hidden />
          Add
        </Button>
      </div>

      {remainingSuggestions.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {remainingSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addItem(s)}
              className="rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-400"
            >
              + {s}
            </button>
          ))}
        </div>
      ) : null}

      {items.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {items.map((item) => (
            <li
              key={item.id}
              className="group flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 transition-colors hover:border-border/80"
            >
              <Checkbox
                id={item.id}
                checked={item.checked}
                onCheckedChange={() => toggle(item.id)}
                aria-label={item.label}
              />
              <label
                htmlFor={item.id}
                className={`flex-1 cursor-pointer text-sm transition-colors ${
                  item.checked ? "text-muted-foreground line-through" : "text-foreground"
                }`}
              >
                {item.label}
              </label>
              <button
                type="button"
                onClick={() => remove(item.id)}
                aria-label={`Remove ${item.label}`}
                className="rounded p-1 text-muted-foreground opacity-0 transition-all hover:bg-muted hover:text-foreground group-hover:opacity-100"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-card/40 px-4 py-6 text-center text-sm text-muted-foreground">
          No checklist items yet. Add your trade rules above.
        </div>
      )}
    </div>
  )
}
