"use client"

import Link from "next/link"
import { BookOpen, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DashboardActions() {
  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="outline" size="sm">
        <Link href="/trades/new?mode=journal">
          <BookOpen className="size-4" aria-hidden />
          Add Journal
        </Link>
      </Button>
      <Button asChild size="sm" className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400">
        <Link href="/trades/new">
          <Plus className="size-4" aria-hidden />
          New Trade
        </Link>
      </Button>
    </div>
  )
}
