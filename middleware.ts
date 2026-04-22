import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from './lib/auth';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  const { pathname } = req.nextUrl;
  const env = getRequestContext().env;

  if (pathname === '/admin/login' || pathname === '/') return NextResponse.next();

  const isProtectedRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/');

  if (isProtectedRoute) {
    const payload = token ? await verifyJWT(token, env.JWT_SECRET) : null;
    if (!payload) {
      if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }
  return NextResponse.next();
}
