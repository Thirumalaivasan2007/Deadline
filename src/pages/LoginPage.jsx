import { SignIn } from '@clerk/clerk-react'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <SignIn afterSignInUrl="/dashboard" />
    </div>
  )
}