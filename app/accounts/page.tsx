import { AccountsList } from "@/components/accounts/accounts-list"
import { SiteNav } from "@/components/site-nav"

export const metadata = {
  title: "Accounts — Trading Journal",
  description: "Create and manage your trading accounts.",
}

export default function AccountsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
        <AccountsList />
      </div>
    </main>
  )
}
