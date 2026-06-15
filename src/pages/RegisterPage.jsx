import { SignUp } from '@clerk/clerk-react'

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <SignUp afterSignUpUrl="/dashboard" />
    </div>
  )
}