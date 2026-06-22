'use client'

import { useActionState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/packages/ui-kit/components/ui/card'
import { Button } from '@/packages/ui-kit/components/ui/button'
import { verifyMFAChallenge } from './actions'
import { useFormStatus } from 'react-dom'
import { AlertCircle } from 'lucide-react'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button className="w-full" type="submit" disabled={pending}>
      {pending ? 'Verifying...' : 'Verify Code'}
    </Button>
  )
}

export default function MFAChallengePage() {
  const [state, formAction] = useActionState(verifyMFAChallenge, null)

  return (
    <div className="flex justify-center items-center h-[calc(100vh-100px)]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            Please enter the 6-digit code from your authenticator app to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="grid gap-4">
            {state?.error && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {state.error}
              </div>
            )}
            
            <div className="grid gap-2">
              <label htmlFor="code" className="text-sm font-medium">Authenticator Code</label>
              <input 
                id="code" name="code" placeholder="123456" required
                maxLength={6}
                pattern="[0-9]*"
                inputMode="numeric"
                autoComplete="one-time-code"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-center tracking-widest text-lg font-mono"
              />
            </div>
            
            <SubmitButton />
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
