import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        return NextResponse.redirect(`${origin}/login?error=This email is already registered. Sign in with your password, then connect Google from Account Settings.`)
      }
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    }

    if (session?.user) {
      // Check if user has an existing organisation and get the slug
      const membership = await prisma.org_members.findFirst({
        where: { user_id: session.user.id },
        select: { organisations: { select: { slug: true } } },
      })

      const forwardedHost = request.headers.get('x-forwarded-host') 
      const isLocalEnv = process.env.NODE_ENV === 'development'
      const baseUrl = isLocalEnv ? origin : (forwardedHost ? `https://${forwardedHost}` : origin)

      if (membership?.organisations?.slug) {
        // Existing user with org — set cookie and redirect to their dashboard
        const response = NextResponse.redirect(`${baseUrl}/${membership.organisations.slug}/dashboard`)
        response.cookies.set('tenant_slug', membership.organisations.slug, {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 365,
        })
        return response
      } else {
        // New user — send to onboarding
        return NextResponse.redirect(`${baseUrl}/onboarding`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`)
}
