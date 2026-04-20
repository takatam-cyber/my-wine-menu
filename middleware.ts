// middleware.ts (完全上書き)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from './lib/auth';

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  const { pathname } = req.nextUrl;

  // ログインページ自体は常に許可
  if (pathname === '/admin') return NextResponse.next();

  // 保護すべきルートの判定
  const isProtectedRoute = pathname.startsWith('/admin') || 
                           pathname.startsWith('/api/wines') || 
                           pathname.startsWith('/api/store/config') ||
                           pathname.startsWith('/api/analytics/ranking');

  if (isProtectedRoute) {
    const payload = token ? await verifyJWT(token) : null;

    if (!payload) {
      if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return NextResponse.redirect(new URL('/admin', req.url));
    }

    // マスター管理画面の特権チェック
    const adminEmail = process.env.ADMIN_EMAIL || 'your-actual-email@example.com'; 
    if (pathname === '/admin/master' && payload.email !== adminEmail) {
      return NextResponse.redirect(new URL('/admin', req.url));
    }

    // 検証済みメールアドレスをヘッダーへ
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-email', payload.email);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/wines/:path*', '/api/store/config/:path*', '/api/analytics/:path*'],
};
