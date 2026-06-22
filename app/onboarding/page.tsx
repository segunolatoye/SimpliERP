'use client'

import { useState, useEffect, useActionState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/packages/ui-kit/components/ui/card'
import { Button } from '@/packages/ui-kit/components/ui/button'
import { Input } from '@/packages/ui-kit/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/packages/ui-kit/components/ui/select'
import { COUNTRIES } from '@/lib/countries'
import { verifyOTPAndComplete } from './actions'
import { useFormStatus } from 'react-dom'
import { AlertCircle, HelpCircle, Pencil, Check, Globe } from 'lucide-react'

function SubmitCompletionButton() {
  const { pending } = useFormStatus()
  return (
    <Button className="w-full" type="submit" disabled={pending}>
      {pending ? 'Setting up Workspace...' : 'Complete Setup'}
    </Button>
  )
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function OnboardingPage() {
  const [completeState, completeAction] = useActionState(verifyOTPAndComplete, null)
  const [orgName, setOrgName] = useState('')
  const [slug, setSlug] = useState('')
  const [isEditingSlug, setIsEditingSlug] = useState(false)
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

  // Auto-generate slug from org name unless manually edited
  useEffect(() => {
    if (!slugManuallyEdited && orgName) {
      setSlug(generateSlug(orgName))
    }
  }, [orgName, slugManuallyEdited])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome to SimpliERP!</CardTitle>
        <CardDescription>
          Let's set up your workspace to get started.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={completeAction} className="grid gap-4">
          {completeState?.error && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {completeState.error}
            </div>
          )}
          
          {/* Business Name */}
          <div className="grid gap-2">
            <label htmlFor="orgName" className="text-sm font-medium">Business Name</label>
            <Input 
              id="orgName" 
              name="orgName" 
              placeholder="Acme Corp" 
              required
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
            />
          </div>

          {/* Slug Preview */}
          <div className="grid gap-2">
            <label htmlFor="slug" className="text-sm font-medium text-slate-400">Workspace URL</label>
            <div className="flex items-center gap-2 bg-[#0B0E14] border border-white/10 rounded-lg px-3 h-11 text-sm">
              <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="text-slate-500">simpli-erp.com/</span>
              {isEditingSlug ? (
                <div className="flex items-center gap-1.5 flex-1">
                  <input
                    id="slug"
                    type="text"
                    className="bg-transparent text-white outline-none flex-1 min-w-0"
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                      setSlugManuallyEdited(true)
                    }}
                    autoFocus
                  />
                  <button
                    type="button"
                    title="Confirm slug"
                    onClick={() => setIsEditingSlug(false)}
                    className="text-emerald-500 hover:text-emerald-400 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span className="text-white truncate">{slug || 'your-workspace'}</span>
                  <button
                    type="button"
                    title="Edit slug"
                    onClick={() => setIsEditingSlug(true)}
                    className="text-slate-500 hover:text-slate-300 transition-colors shrink-0"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
            {/* Hidden input to submit slug value */}
            <input type="hidden" name="slug" value={slug} />
          </div>

          {/* Country */}
          <div className="grid gap-2">
            <label className="text-sm font-medium">Country</label>
            <Select name="country" required defaultValue="Nigeria">
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map(country => (
                  <SelectItem key={country} value={country}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Business Type + Company Size */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label htmlFor="businessType" className="text-sm font-medium">Business Type</label>
              <Select name="businessType" required defaultValue="retail">
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="services">Services</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label htmlFor="companySize" className="text-sm font-medium">Company Size</label>
              <Select name="companySize" required defaultValue="1-10">
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-10">1–10 employees</SelectItem>
                  <SelectItem value="11-50">11–50 employees</SelectItem>
                  <SelectItem value="51-200">51–200 employees</SelectItem>
                  <SelectItem value="201-500">201–500 employees</SelectItem>
                  <SelectItem value="500+">500+ employees</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Base Currency + Language */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <div className="flex items-center gap-1.5">
                <label htmlFor="baseCurrency" className="text-sm font-medium">Base Currency</label>
                <div className="group relative flex items-center">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden w-48 p-2 bg-slate-800 text-xs text-white text-center rounded-md shadow-lg group-hover:block z-10 before:absolute before:top-full before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-slate-800">
                    Base currency cannot be changed after your workspace is created.
                  </div>
                </div>
              </div>
              <Select name="baseCurrency" required defaultValue="NGN">
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NGN">NGN - Nigerian Naira</SelectItem>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                  <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label htmlFor="language" className="text-sm font-medium">Language</label>
              <Select name="language" required defaultValue="English">
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="French">Français</SelectItem>
                  <SelectItem value="Spanish">Español</SelectItem>
                  <SelectItem value="Portuguese">Português</SelectItem>
                  <SelectItem value="Arabic">العربية</SelectItem>
                  <SelectItem value="German">Deutsch</SelectItem>
                  <SelectItem value="Chinese">中文</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <SubmitCompletionButton />
        </form>
      </CardContent>
    </Card>
  )
}
