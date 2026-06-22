'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function verifyMFAChallenge(prevState: any, formData: FormData) {
  const code = formData.get('code') as string

  if (!code) {
    return { error: 'Please enter a verification code' }
  }

  const supabase = await createClient()

  const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors()
  
  if (factorsError) {
    return { error: factorsError.message }
  }

  const totpFactor = factors.totp[0]

  if (!totpFactor) {
    return { error: 'No TOTP factor found on your account. Please contact support.' }
  }

  const challengeId = await supabase.auth.mfa.challenge({ factorId: totpFactor.id })

  if (challengeId.error) {
    return { error: challengeId.error.message }
  }

  const verifyRes = await supabase.auth.mfa.verify({
    factorId: totpFactor.id,
    challengeId: challengeId.data.id,
    code,
  })

  if (verifyRes.error) {
    return { error: 'Invalid verification code' }
  }

  // The session is now elevated to AAL2!
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user?.app_metadata?.is_super_admin) {
    redirect('/admin')
  }

  redirect('/dashboard')
}
