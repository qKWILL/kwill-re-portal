import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LoginForm from './login-form'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/KWILL Logo_Horizontal.png"
            alt="KWILL Merchant Advisors"
            width={280}
            height={75}
            priority
            className="h-14 w-auto"
          />
          <p className="text-neutral-500 mt-4">Portal Sign In</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
