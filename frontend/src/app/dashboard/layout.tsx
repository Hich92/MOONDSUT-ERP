import { redirect }          from 'next/navigation'
import { getToken }           from '@/lib/auth'
import { DashboardShell }     from '@/components/layout/DashboardShell'
import { OnboardingModal }    from '@/components/onboarding/OnboardingModal'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const token = getToken()
  if (!token) redirect('/login')

  return (
    <DashboardShell>
      {children}
      <OnboardingModal />
    </DashboardShell>
  )
}
