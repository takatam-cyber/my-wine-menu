// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from './lib/auth';

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  const { pathname, searchParams } = req.nextUrl;

  if (pathname === '/admin') return NextResponse.next();

  // 公開メニュー用のAPIアクセスを許可
  if (pathname === '/api/wines' && searchParams.has('slug')) return NextResponse.next();
  if (pathname.startsWith('/api/store/config/public')) return NextResponse.next();

  const isProtectedRoute = 
    pathname.startsWith('/admin') || 
    pathname.startsWith('/api/wines') || 
    pathname.startsWith('/api/store/config') ||
    pathname.startsWith('/api/analytics/ranking');

  if (isProtectedRoute) {
    const payload = token ? await verifyJWT(token) : null;
    if (!payload) {
      if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return NextResponse.redirect(new URL('/admin', req.url));
    }
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-email', payload.email);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/wines/:path*', '/api/store/config/:path*', '/api/analytics/:path*'],
};
