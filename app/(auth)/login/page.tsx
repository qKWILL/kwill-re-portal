import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LoginForm from './login-form'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-[420px]">
        <div className="flex flex-col items-center mb-10">
          <Image
            src="/KWILL Logo_Horizontal.png"
            alt="KWILL Merchant Advisors"
            width={280}
            height={75}
            priority
            className="h-12 w-auto"
          />
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
