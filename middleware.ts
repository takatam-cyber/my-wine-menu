// middleware.ts (完全上書き)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from './lib/auth';

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  const { pathname } = req.nextUrl;

  // 1. ログインページ自体は常に許可
  if (pathname === '/admin') return NextResponse.next();

  // 2. 保護すべきルートの判定
  const isProtectedRoute = 
    pathname.startsWith('/admin') || 
    pathname.startsWith('/api/wines') || 
    pathname.startsWith('/api/store/config') ||
    pathname.startsWith('/api/analytics/ranking');

  if (isProtectedRoute) {
    const payload = token ? await verifyJWT(token) : null;

    // トークンがない、または不正な場合は追い出す
    if (!payload) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/admin', req.url));
    }

    // 3. インポーター専用（マスター管理）の保護
    // 環境変数 ADMIN_EMAIL がない場合は、あなたのメールアドレスを直接書く
    const adminEmail = process.env.ADMIN_EMAIL || 'your-admin@email.com'; 
    if (pathname === '/admin/master' && payload.email !== adminEmail) {
      return NextResponse.redirect(new URL('/admin', req.url));
    }

    // 4. 認証済みユーザーの情報をヘッダーでAPIに渡す
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-email', payload.email);
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/wines/:path*', '/api/store/config/:path*', '/api/analytics/:path*'],
};
