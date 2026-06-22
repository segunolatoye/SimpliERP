import { NextRequest } from 'next/server';
import { ForbiddenError } from '@/lib/errors/appError';

/**
 * Validates the Origin header for REST API requests to mitigate CSRF attacks.
 * Note: Server Actions have built-in CSRF protection in Next.js.
 */
export function validateOrigin(request: NextRequest, allowedOrigins: string[] = []) {
  // Only check state-modifying methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return;
  }

  const origin = request.headers.get('origin') || request.headers.get('referer');
  const host = request.headers.get('host');

  if (!origin || !host) {
    throw new ForbiddenError('Missing Origin or Host header.');
  }

  try {
    const originUrl = new URL(origin);
    
    // Allow if origin host matches request host (same origin)
    if (originUrl.host === host) {
      return;
    }

    // Allow explicitly whitelisted origins
    if (allowedOrigins.includes(originUrl.origin)) {
      return;
    }
    
  } catch {
    throw new ForbiddenError('Invalid Origin header.');
  }

  throw new ForbiddenError('CSRF validation failed: Origin mismatch.');
}
