'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { recordAudit } from '@/lib/security/audit'
import { checkRateLimit, RATE_LIMITS } from '@/lib/security/rateLimit'
import { AppError } from '@/lib/errors/appError'

import { onboardingSchema } from '@/modules/core/schemas/onboarding'

export async function verifyOTPAndComplete(prevState: any, formData: FormData) {
  const validation = onboardingSchema.safeParse({
    orgName: formData.get('orgName'),
    country: formData.get('country'),
    businessType: formData.get('businessType'),
    baseCurrency: formData.get('baseCurrency'),
    language: formData.get('language') || undefined,
    companySize: formData.get('companySize') || undefined,
    slug: formData.get('slug') || undefined,
  });

  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  const { orgName, country, businessType, baseCurrency, language, companySize, slug: userSlug } = validation.data;

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Rate Limiting: Prevent abuse of the onboarding endpoint
  try {
    await checkRateLimit(`onboarding:${user.id}`, RATE_LIMITS.ONBOARDING);
  } catch (err: any) {
    if (err instanceof AppError) {
      return { error: err.message };
    }
    console.error("Rate limit check failed:", err);
  }

  // Prevent multiple onboarding creations
  const existingOrgs = await prisma.org_members.findFirst({
    where: { user_id: user.id },
    select: { organisations: { select: { slug: true } } }
  })

  if (existingOrgs?.organisations?.slug) {
    const cookieStore = await cookies()
    cookieStore.set('tenant_slug', existingOrgs.organisations.slug, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    })
    redirect(`/${existingOrgs.organisations.slug}/dashboard`)
  }

  let orgSlug = ''

  try {
    // Use user-provided slug or auto-generate, append random suffix for uniqueness
    const baseSlug = userSlug 
      ? userSlug.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '')
      : orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    orgSlug = baseSlug + '-' + Math.random().toString(36).substring(2, 6)
    const orgId = crypto.randomUUID()
    
    // Execute all database operations atomically within a transaction
    await prisma.$transaction(async (tx) => {
      // Enforce RLS by injecting the user identity into the database context
      await tx.$executeRaw`SET LOCAL request.jwt.claim.sub = ${user.id};`

      // Generate a unique sequential org code (ORG-1000, ORG-1001, ...)
      const orgCount = await tx.organisations.count()
      const orgCode = `ORG-${orgCount + 1000}`

      // Create Organisation
      await tx.organisations.create({
        data: {
          id: orgId,
          name: orgName,
          slug: orgSlug,
          org_code: orgCode,
          plan: 'free',
          status: 'active',
          payment_mode: 'card',
          address: country,
          base_currency: baseCurrency,
          industry: businessType,
          company_size: companySize,
          language: language,
          communication_language: language,
          primary_contact: user.id,
          updated_at: new Date()
        }
      })

      // Add User to Organisation
      await tx.org_members.create({
        data: {
          id: crypto.randomUUID(),
          org_id: orgId,
          user_id: user.id,
          role: 'owner',
          permissions: ['*'],
          updated_at: new Date()
        }
      })

      // Add Base Currency to Currencies Table
      const currencyMap: Record<string, {name: string, symbol: string}> = {
        'USD': { name: 'US Dollar', symbol: '$' },
        'EUR': { name: 'Euro', symbol: '€' },
        'GBP': { name: 'British Pound', symbol: '£' },
        'NGN': { name: 'Nigerian Naira', symbol: '₦' },
        'CAD': { name: 'Canadian Dollar', symbol: 'C$' },
        'AUD': { name: 'Australian Dollar', symbol: 'A$' },
        'JPY': { name: 'Japanese Yen', symbol: '¥' },
        'INR': { name: 'Indian Rupee', symbol: '₹' },
        'ZAR': { name: 'South African Rand', symbol: 'R' },
        'KES': { name: 'Kenyan Shilling', symbol: 'KSh' },
      };
      const cInfo = currencyMap[baseCurrency] || { name: baseCurrency, symbol: baseCurrency };

      await tx.currencies.create({
        data: {
          id: crypto.randomUUID(),
          org_id: orgId,
          code: baseCurrency,
          name: cInfo.name,
          symbol: cInfo.symbol,
          exchange_rate: 1.0,
          is_base_currency: true,
          updated_at: new Date()
        }
      })

      // Record Audit Log atomically
      await recordAudit(tx, {
        orgId: orgId,
        userId: user.id,
        module: 'core/auth',
        action: 'workspace_created',
        entityType: 'organisation',
        entityId: orgId,
        diff: { name: orgName, slug: orgSlug, country, businessType, baseCurrency }
      })
    })

    // Set the tenant slug cookie for middleware redirects
    const cookieStore = await cookies()
    cookieStore.set('tenant_slug', orgSlug, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    })

  } catch (err: any) {
    console.error("Onboarding failed:", err)
    return { error: err.message || 'An unexpected error occurred during workspace creation' }
  }

  redirect(`/${orgSlug}/dashboard`)
}
