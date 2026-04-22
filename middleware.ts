import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from './lib/auth';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const env = (getRequestContext() as any).env;
  const secret = env.JWT_SECRET || "fallback";

  // ホワイトリスト
  if (
    pathname === '/' || pathname === '/admin/login' || 
    pathname === '/admin/register' || pathname === '/api/auth' || 
    pathname === '/api/auth/register' || 
    pathname.startsWith('/api/store/config/public') || 
    pathname.startsWith('/api/wines')
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get('auth_token')?.value;
  const payload = token ? await verifyJWT(token, secret) : null;

  if (!payload) {
    if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }

  // 【重要】ログインユーザーのメールアドレスをヘッダーにセットしてAPIに渡す
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-user-email', payload.email);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};
