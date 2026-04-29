import Link from "next/link"
import { AuthShell } from "@/components/auth/auth-shell"
import { SignUpForm } from "@/components/auth/signup-form"
import { GuestGuard } from "@/components/auth-guard"

export const metadata = {
  title: "Sign up — Trade Journal Insights",
  description: "Create a free account to start journaling your trades.",
}

export default function SignUpPage() {
  return (
    <GuestGuard>
      <AuthShell
        title="Create your account"
        description="Build discipline. Track every setup. Improve every trade."
        footer={
          <span>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-emerald-300 hover:text-emerald-200">
              Log in
            </Link>
          </span>
        }
      >
        <SignUpForm />
      </AuthShell>
    </GuestGuard>
  )
}
