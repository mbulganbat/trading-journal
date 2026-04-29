import { LineChart } from "lucide-react"
import { NewTradeForm } from "@/components/trade-form/new-trade-form"
import { SiteNav } from "@/components/site-nav"

type SearchParams = Promise<{ mode?: string }>

export default async function NewTradePage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const initialMode = sp?.mode === "journal" ? "journal" : "trade"

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
        <header className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl border border-border bg-card">
            <LineChart className="size-5 text-emerald-400" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-balance">
              {initialMode === "journal" ? "New Journal Entry" : "New Trade"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Plan, calculate risk &amp; reward, and log every detail.
            </p>
          </div>
        </header>

        <NewTradeForm initialMode={initialMode} />
      </div>
    </main>
  )
}
