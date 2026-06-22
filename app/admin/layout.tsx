import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Secondary Layout-level server check to verify against the Database (not just JWT)
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { is_superadmin: true }
  })

  // Verify that the user has the superadmin flag enabled in the DB
  if (!dbUser?.is_superadmin) {
    redirect('/403') // Access denied
  }

  // Enforce MFA step-up again at the layout level
  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aalData && aalData.currentLevel !== 'aal2') {
    redirect('/mfa-challenge')
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-900 text-slate-100">
      <header className="flex h-14 items-center gap-4 border-b border-slate-800 bg-slate-950 px-6">
        <div className="flex items-center gap-2 font-semibold text-red-500">
          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
          SimpliERP Super Admin
        </div>
      </header>
      <main className="flex-1 p-6">
        <div className="mb-4 p-4 rounded-md border border-red-900 bg-red-950/30 text-red-200 text-sm flex justify-between items-center">
          <div>
            <strong>HIGH SENSITIVITY AREA.</strong> All actions are audited.
          </div>
        </div>
        {children}
      </main>
    </div>
  )
}
