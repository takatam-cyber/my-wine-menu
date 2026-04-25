// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from './lib/auth';

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  const { pathname, searchParams } = req.nextUrl;

  // 1. ログイン画面自体、および静的ファイルは常に許可
  if (pathname === '/admin' || pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // 2. 公開メニュー用のパスは許可
  if (pathname === '/api/wines' && searchParams.has('slug')) return NextResponse.next();
  if (pathname.startsWith('/api/store/config/public')) return NextResponse.next();
  if (!pathname.startsWith('/admin') && !pathname.startsWith('/api')) {
    // [slug] のような動的ルート
    return NextResponse.next();
  }

  // 3. 保護対象の判定
  const isProtectedRoute = 
    pathname.startsWith('/admin/') || 
    pathname.startsWith('/api/wines') || 
    pathname.startsWith('/api/store/config') ||
    pathname.startsWith('/api/master') ||
    pathname.startsWith('/api/analytics');

  if (isProtectedRoute) {
    const payload = token ? await verifyJWT(token) : null;
    
    if (!payload) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/admin', req.url));
    }

    // 認証情報をヘッダーに付与
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-email', payload.email);
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
