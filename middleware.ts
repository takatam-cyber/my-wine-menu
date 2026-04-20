// middleware.ts (完全版)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';
import { verifyJWT } from './lib/auth';

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  const { pathname } = req.nextUrl;

  // 1. 管理画面・設定・ワイン操作APIを保護対象にする
  const isProtectedRoute = 
    pathname.startsWith('/admin') || 
    pathname.startsWith('/api/wines') || 
    pathname.startsWith('/api/store/config');

  // ログインページ自体は保護から除外
  if (pathname === '/admin') return NextResponse.next();

  if (isProtectedRoute) {
    const payload = token ? await verifyJWT(token) : null;

    // トークンがない、または不正な場合は追い出す
    if (!payload) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/admin', req.url));
    }

    // 2. インポーター専用（マスター管理）の保護
    // ADMIN_EMAILが設定されていない場合は、あなたの本物のメールアドレスをここに書く
    const adminEmail = process.env.ADMIN_EMAIL || 'your-actual-email@example.com'; 
    if (pathname === '/admin/master' && payload.email !== adminEmail) {
      return NextResponse.redirect(new URL('/admin', req.url));
    }

    // 3. 認証済みユーザーのメールアドレスをAPIに引き継ぐ
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-email', payload.email);
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/wines/:path*', '/api/store/config/:path*'],
};
