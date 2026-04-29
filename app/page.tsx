import { DashboardPreview } from "@/components/landing/dashboard-preview"
import { FeaturesGrid } from "@/components/landing/features-grid"
import { LandingCTA } from "@/components/landing/landing-cta"
import { LandingFooter } from "@/components/landing/landing-footer"
import { LandingHero } from "@/components/landing/landing-hero"
import { LandingNav } from "@/components/landing/landing-nav"

export const metadata = {
  title: "Trade Journal Insights — Build discipline. Track every setup.",
  description:
    "A trading journal built for SMC, ICT, price action, and prop firm traders. Log trades, calculate risk, and review your edge on a calendar.",
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <LandingNav />
      <LandingHero />
      <DashboardPreview />
      <FeaturesGrid />
      <LandingCTA />
      <LandingFooter />
    </main>
  )
}
