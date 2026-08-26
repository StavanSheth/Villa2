import { NextRequest, NextResponse } from 'next/server';
import { createRemoteJWKSet, jwtVerify } from 'jose';

// Firebase JWKS endpoint for verifying RS256 JWTs
const FIREBASE_JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
const JWKS = createRemoteJWKSet(new URL(FIREBASE_JWKS_URL));

// Session duration: 45 minutes in milliseconds
const SESSION_MAX_AGE_MS = 45 * 60 * 1000;

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://storage.mavon.online https://images.unsplash.com; connect-src 'self' https://api.mavon.online; font-src 'self' https://fonts.gstatic.com; frame-ancestors 'none';"
  );
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  return response;
}

export async function protectRoute(req: NextRequest, allowedRoles?: string[]) {
  const token = req.cookies.get('access_token')?.value;
  const hostname = req.nextUrl.hostname;
  const domain = hostname.split('.')[0];
  const isDev = process.env.NODE_ENV !== 'production' || hostname === 'localhost';
  const loginUrl = req.nextUrl.pathname.startsWith('/login') ? null : '/login';

  // Allow access to login page always
  if (req.nextUrl.pathname.startsWith('/login')) {
    return addSecurityHeaders(NextResponse.next());
  }

  // ── No token → Redirect to login ──
  if (!token) {
    const redirectUrl = new URL(loginUrl || '/login', req.url);
    redirectUrl.searchParams.set('reason', 'unauthenticated');
    return NextResponse.redirect(redirectUrl);
  }

  try {
    // ── Real Firebase JWT verification ──
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!projectId) {
      console.warn('Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID for verification');
    }

    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });

    // Check JWT expiration (45-minute session)
    const issuedAt = payload.iat as number | undefined;
    if (issuedAt && (Math.floor(Date.now() / 1000) - issuedAt) > (SESSION_MAX_AGE_MS / 1000)) {
      const redirectUrl = new URL('/login', req.url);
      redirectUrl.searchParams.set('reason', 'expired');
      const response = NextResponse.redirect(redirectUrl);
      response.cookies.delete('access_token');
      response.cookies.delete('session_start');
      return response;
    }

    // Role checking for real JWTs
    const role = payload.role as string;
    if (allowedRoles && allowedRoles.length > 0) {
      if (!allowedRoles.includes(role)) {
        return new NextResponse('403 Forbidden - Role Not Authorized', { status: 403 });
      }
    }

    // Domain enforcement for production subdomains
    const allowedDomains = (payload.domains as string[]) || [];
    if (domain !== 'localhost' && !allowedDomains.includes(domain)) {
      return new NextResponse('403 Forbidden - Subdomain Access Denied', { status: 403 });
    }

    return addSecurityHeaders(NextResponse.next());
  } catch (error) {
    console.warn('Edge Middleware: JWT Verification Failed', error);
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('reason', 'invalid');
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete('access_token');
    response.cookies.delete('session_start');
    return response;
  }
}

// ── Helper for API route auth (importable by API routes) ──
export async function authenticateApiRequest(req: Request): Promise<{ uid: string; role: string } | null> {
  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader.match(/access_token=([^;]+)/);
  if (!match) return null;

  const token = match[1];

  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });

    // Check session expiry
    const issuedAt = payload.iat as number | undefined;
    if (issuedAt && (Math.floor(Date.now() / 1000) - issuedAt) > (SESSION_MAX_AGE_MS / 1000)) {
      return null;
    }

    return { uid: payload.user_id as string, role: (payload.role as string) || 'CUSTOMER' };
  } catch (e) {
    console.error('API JWT Verification Failed:', e);
    return null;
  }
}
