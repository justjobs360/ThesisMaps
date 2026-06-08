import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware runs on Edge — cannot import firebase-admin (Node.js).
// Token verification happens in the API route handlers (admin-guard.ts).
// Here we simply check for the presence of a session cookie or Authorization header.

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAppRoute = pathname.startsWith('/app') || pathname.startsWith('/(app)');
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/(admin)');
  const isAdminApi = pathname.startsWith('/api/admin');

  const sessionCookie = request.cookies.get('session')?.value;
  const authHeader = request.headers.get('Authorization');
  const hasToken = Boolean(sessionCookie ?? authHeader);

  // Protect app and admin UI routes
  if ((isAppRoute || isAdminRoute) && !hasToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin API routes without token → 401
  if (isAdminApi && !hasToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/(app)/:path*',
    '/app/:path*',
    '/(admin)/:path*',
    '/admin/:path*',
    '/api/admin/:path*',
    '/dashboard/:path*',
    '/graph/:path*',
    '/search/:path*',
    '/outline/:path*',
    '/timeline/:path*',
    '/seeds/:path*',
    '/gaps/:path*',
    '/defence/:path*',
    '/collaborate/:path*',
    '/settings/:path*',
  ],
};
