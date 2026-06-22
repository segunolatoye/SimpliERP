'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'


export async function signUp(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  // Password Policy
  if (password.length < 10) {
    return { error: 'Password must be at least 10 characters long' }
  }

  const supabase = await createClient()
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
      }
    }
  })

  if (error) {
    return { error: error.message }
  }

  // Postgres Trigger 'handle_new_user' takes care of creating the public.users record
  // Proceed directly to the onboarding step
  redirect('/onboarding')
}

export async function signInWithPassword(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const supabase = await createClient()

  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  if (data.user) {
    // Check if the user is super admin
    if (data.user.app_metadata?.is_super_admin) {
      redirect('/admin')
    }

    // Resolve the user's org slug for tenant routing
    const membership = await prisma.org_members.findFirst({
      where: { user_id: data.user.id },
      select: { organisations: { select: { slug: true } } },
    })

    if (membership?.organisations?.slug) {
      const cookieStore = await cookies()
      cookieStore.set('tenant_slug', membership.organisations.slug, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365,
      })
      redirect(`/${membership.organisations.slug}/dashboard`)
    }
  }

  // No org found — send to onboarding
  redirect('/onboarding')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  // Clear the tenant slug cookie on sign out
  const cookieStore = await cookies()
  cookieStore.delete('tenant_slug')
  redirect('/login')
}
