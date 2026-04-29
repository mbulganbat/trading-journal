import Link from "next/link"
import { AuthShell } from "@/components/auth/auth-shell"
import { LoginForm } from "@/components/auth/login-form"
import { GuestGuard } from "@/components/auth-guard"

export const metadata = {
  title: "Log in — Trade Journal Insights",
  description: "Log in to your trading journal account.",
}

export default function LoginPage() {
  return (
    <GuestGuard>
      <AuthShell
        title="Welcome back"
        description="Log in to track your trades and review your progress."
        footer={
          <span>
            Don&apos;t have an account?{" "}
            <Link href="/sign-up" className="font-medium text-emerald-300 hover:text-emerald-200">
              Sign up
            </Link>
          </span>
        }
      >
        <LoginForm />
      </AuthShell>
    </GuestGuard>
  )
}
