'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import crypto from 'crypto'

export async function enrollMFA() {
  const supabase = await createClient()

  // 1. Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // 2. Unenroll existing factors if necessary (to restart enrollment)
  const { data: factors } = await supabase.auth.mfa.listFactors()
  if (factors && factors.totp.length > 0) {
    const activeFactor = factors.totp.find((f: any) => f.status === 'verified')
    if (activeFactor) {
      return { error: 'MFA is already enabled on this account.' }
    }
  }

  // 3. Start enrollment
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
  })

  if (error) {
    return { error: error.message }
  }

  // Generate Backup Codes
  const backupCodes = Array.from({ length: 8 }, () => {
    return crypto.randomBytes(4).toString('hex') // 8 character hex codes
  })

  // Hash backup codes to save in the database
  const hashedCodes = backupCodes.map(code => {
    return crypto.createHash('sha256').update(code).digest('hex')
  })

  await prisma.user.update({
    where: { id: user.id },
    data: {
      mfa_enabled: false, // will set to true on verification
      mfa_secret: JSON.stringify(hashedCodes) // Reusing mfa_secret column to store backup code hashes
    }
  })

  return {
    success: true,
    factorId: data.id,
    qrCode: data.totp.qr_code,
    backupCodes: backupCodes
  }
}

export async function verifyMFAEnrollment(prevState: any, formData: FormData) {
  const factorId = formData.get('factorId') as string
  const code = formData.get('code') as string

  if (!factorId || !code) {
    return { error: 'Missing factor ID or verification code' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Not authenticated' }

  const challengeId = await supabase.auth.mfa.challenge({ factorId })

  if (challengeId.error) {
    return { error: challengeId.error.message }
  }

  const verifyRes = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challengeId.data.id,
    code,
  })

  if (verifyRes.error) {
    return { error: 'Invalid verification code. Please try again.' }
  }

  // Record that MFA is fully enabled in DB
  await prisma.user.update({
    where: { id: user.id },
    data: {
      mfa_enabled: true,
      mfa_type: 'totp'
    }
  })

  return { success: true }
}
