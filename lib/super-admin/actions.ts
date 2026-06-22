'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { headers } from 'next/headers'

/**
 * Validates that the current user is a superadmin, checking both the JWT and the Database.
 * Throws an error if unauthorized.
 */
async function enforceSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || (!user.app_metadata?.is_super_admin && user.app_metadata?.role !== 'super_admin')) {
    throw new Error('Unauthorized')
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { is_superadmin: true }
  })

  if (!dbUser?.is_superadmin) {
    throw new Error('Unauthorized in database')
  }

  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aalData?.currentLevel !== 'aal2') {
    throw new Error('MFA Required')
  }

  return user
}

/**
 * Logs a super admin action to the audit logs.
 */
async function logSuperAdminAction(user: any, action: string, details: any) {
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
  const userAgent = headersList.get('user-agent') || 'unknown'

  await prisma.auditLog.create({
    data: {
      id: crypto.randomUUID(),
      org_id: 'SYSTEM', // Super admin actions span across the platform
      user_id: user.id,
      module: 'SUPER_ADMIN',
      action: action,
      entity_type: 'platform',
      entity_id: 'platform',
      diff: details,
      ip: ip,
      user_agent: userAgent,
      created_at: new Date()
    }
  })
}

/**
 * Example super_admin action: Fetch all tenants
 */
export async function getAllTenants() {
  const user = await enforceSuperAdmin()
  
  const tenants = await prisma.organisations.findMany({
    orderBy: { created_at: 'desc' },
    take: 100
  })

  await logSuperAdminAction(user, 'viewed_all_tenants', { count: tenants.length })

  return tenants
}

/**
 * Example super_admin action: Block a tenant
 */
export async function blockTenant(tenantId: string) {
  const user = await enforceSuperAdmin()
  
  const updated = await prisma.organisations.update({
    where: { id: tenantId },
    data: { status: 'blocked' }
  })

  await logSuperAdminAction(user, 'blocked_tenant', { tenantId, status: 'blocked' })

  return updated
}
