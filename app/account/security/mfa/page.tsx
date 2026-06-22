'use client'

import { useState, useActionState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/packages/ui-kit/components/ui/card'
import { Button } from '@/packages/ui-kit/components/ui/button'
import { enrollMFA, verifyMFAEnrollment } from './actions'
import { useFormStatus } from 'react-dom'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import Image from 'next/image'

function EnrollButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Starting Enrollment...' : 'Set up Authenticator App'}
    </Button>
  )
}

function VerifyButton() {
  const { pending } = useFormStatus()
  return (
    <Button className="w-full" type="submit" disabled={pending}>
      {pending ? 'Verifying...' : 'Verify and Enable'}
    </Button>
  )
}

export default function MFAEnrollmentPage() {
  const [enrollState, enrollAction] = useActionState(enrollMFA, null)
  const [verifyState, verifyAction] = useActionState(verifyMFAEnrollment, null)
  const [savedBackup, setSavedBackup] = useState(false)

  if (verifyState?.success) {
    return (
      <Card className="w-full max-w-lg mx-auto mt-10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CheckCircle2 className="text-green-500" /> MFA Enabled Successfully</CardTitle>
          <CardDescription>
            Your account is now secured with Two-Factor Authentication.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => window.location.href = '/dashboard'}>Go to Dashboard</Button>
        </CardFooter>
      </Card>
    )
  }

  if (enrollState?.success) {
    return (
      <Card className="w-full max-w-lg mx-auto mt-10">
        <CardHeader>
          <CardTitle>Configure Authenticator App</CardTitle>
          <CardDescription>
            Scan the QR code with your authenticator app (like Google Authenticator or Authy), then enter the 6-digit code to verify.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="flex justify-center p-4 bg-white rounded-md border">
            {enrollState.qrCode ? (
              <img src={enrollState.qrCode} alt="QR Code" width={200} height={200} />
            ) : (
              <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-100">QR Code Error</div>
            )}
          </div>
          
          <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 p-4 rounded-md">
            <h4 className="font-semibold text-orange-800 dark:text-orange-300 mb-2">Save your Backup Codes</h4>
            <p className="text-sm text-orange-700 dark:text-orange-400 mb-3">If you lose your device, these codes are the only way to access your account.</p>
            <div className="grid grid-cols-2 gap-2 font-mono text-sm bg-background p-3 rounded border">
              {enrollState.backupCodes?.map((code: string) => (
                <div key={code}>{code}</div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <input 
                type="checkbox" 
                id="saved-backup" 
                checked={savedBackup}
                onChange={(e) => setSavedBackup(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <label htmlFor="saved-backup" className="text-sm font-medium">I have safely saved these backup codes</label>
            </div>
          </div>

          <form action={verifyAction} className="grid gap-4">
            {verifyState?.error && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {verifyState.error}
              </div>
            )}
            
            <input type="hidden" name="factorId" value={enrollState.factorId} />
            
            <div className="grid gap-2">
              <label htmlFor="code" className="text-sm font-medium">Verification Code</label>
              <input 
                id="code" name="code" placeholder="123456" required
                maxLength={6}
                pattern="[0-9]*"
                inputMode="numeric"
                autoComplete="one-time-code"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-center tracking-widest text-lg font-mono"
              />
            </div>
            
            <Button className="w-full" type="submit" disabled={!savedBackup}>
              Verify and Enable
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-lg mx-auto mt-10">
      <CardHeader>
        <CardTitle>Two-Factor Authentication (MFA)</CardTitle>
        <CardDescription>
          Add an extra layer of security to your account. We recommend using a time-based one-time password (TOTP) application.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {enrollState?.error && (
          <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4" />
            {enrollState.error}
          </div>
        )}
        <form action={enrollAction}>
          <EnrollButton />
        </form>
      </CardContent>
    </Card>
  )
}
