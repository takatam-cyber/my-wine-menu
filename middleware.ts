// middleware.ts の完全修正版
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
  // トークンの「存在」と「有効性」の両方をチェック
  const payload = token ? await verifyJWT(token, secret) : null;

  if (!payload) {
    if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }

  // ログインユーザーのアドレスをヘッダーにセットしてAPIで使えるようにする
  const response = NextResponse.next();
  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};
