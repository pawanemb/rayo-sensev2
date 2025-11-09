import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type AuthGuardProps = {
  children: React.ReactNode
}

export default async function AuthGuard({ children }: AuthGuardProps) {
  const supabase = await createClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      redirect('/signin')
    }

    // Always check for admin role - this system is admin-only
    const userRole = user?.user_metadata?.role || user?.app_metadata?.role
    
    if (userRole !== 'admin') {
      redirect('/signin?error=admin_required')
    }

    return <>{children}</>
  } catch (error) {
    console.error('Auth error:', error)
    redirect('/signin')
  }
}
