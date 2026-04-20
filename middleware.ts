// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from './lib/auth';

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  const { pathname } = req.nextUrl;

  // 1. 管理画面の保護
  if (pathname.startsWith('/admin')) {
    // マスター管理画面は特定の管理者メールのみ許可（あなた専用）
    if (pathname === '/admin/master') {
      const payload = token ? await verifyJWT(token) : null;
      if (payload?.email !== 'your-admin@email.com') { // あなたのメールアドレスに書き換え
        return NextResponse.redirect(new URL('/admin', req.url));
      }
    }
    
    // 一般の店舗管理画面
    if (!token || !(await verifyJWT(token))) {
      if (pathname !== '/admin') {
        return NextResponse.redirect(new URL('/admin', req.url));
      }
    }
  }

  // 2. APIの保護
  if (pathname.startsWith('/api/wines') || pathname.startsWith('/api/master')) {
    const payload = token ? await verifyJWT(token) : null;
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // APIリクエストに検証済みのユーザー情報をヘッダーで渡す
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-email', payload.email);
    
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/wines/:path*', '/api/master/:path*'],
};
