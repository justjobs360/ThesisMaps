import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware runs on Edge and cannot import firebase-admin (Node.js), so it
// cannot verify a Firebase ID token. It is therefore defence-in-depth for the
// admin API only: a cheap "is there any credential at all" rejection before the
// route runs. Real enforcement lives in two places that CAN verify:
//   - server: requireUser() / requireAdmin() in every route handler
//   - client: <AdminGuard> in app/(admin)/layout.tsx, <AuthProvider> for app pages
//
// Deliberately NOT guarding UI routes here. A previous version matched
// /dashboard, /graph, … and tested `pathname.startsWith('/app')`, which never
// matches those URLs (the `(app)` route group is not part of the path) — so it
// was dead code. The same check DID match /admin, but since no session cookie
// is ever minted and browsers don't send Authorization headers on document
// navigations, it bounced legitimate admins to /login on every visit.
export function middleware(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const sessionCookie = request.cookies.get('session')?.value;

  if (!authHeader && !sessionCookie) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/admin/:path*'],
};
