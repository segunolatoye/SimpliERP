import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that don't require a tenant slug (public or system routes)
const PUBLIC_PATHS = ['/', '/login', '/signup', '/mfa-challenge', '/onboarding', '/403', '/api'];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
}

export async function updateSession(request: NextRequest) {
  // Generate unique request trace ID
  const requestId = crypto.randomUUID()
  request.headers.set('x-request-id', requestId)

  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })
  
  // Attach requestId to the response as well for client support correlation
  supabaseResponse.headers.set('x-request-id', requestId)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          supabaseResponse.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          supabaseResponse.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

  const pathname = request.nextUrl.pathname;
  const isPublic = isPublicPath(pathname);
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
  const isAuthRoute = pathname.startsWith('/login') || 
                      pathname.startsWith('/signup') ||
                      pathname.startsWith('/mfa-challenge');

  // If not authenticated and accessing a non-public route (i.e., a tenant route), redirect to login
  if (!user && !isPublic && !isAdminRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Also handle admin routes without auth
  if (!user && isAdminRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Handle MFA step-up
  if (user && aalData && aalData.currentLevel === 'aal1' && aalData.nextLevel === 'aal2') {
    if (pathname !== '/mfa-challenge') {
      const url = request.nextUrl.clone()
      url.pathname = '/mfa-challenge'
      return NextResponse.redirect(url)
    }
  }
                           
  // Redirect authenticated users away from auth routes to their tenant dashboard
  // We store the slug in a cookie after onboarding/login for quick middleware redirects
  if (user && isAuthRoute) {
    const tenantSlug = request.cookies.get('tenant_slug')?.value;
    const url = request.nextUrl.clone()
    if (tenantSlug) {
      url.pathname = `/${tenantSlug}/dashboard`
    } else {
      // No slug cookie — send to onboarding (they may not have an org yet)
      url.pathname = '/onboarding'
    }
    return NextResponse.redirect(url)
  }

  // Admin check for `/admin` route
  if (isAdminRoute) {
    if (user?.app_metadata?.role !== 'super_admin' && user?.app_metadata?.is_super_admin !== true) {
      const url = request.nextUrl.clone()
      url.pathname = '/403'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
