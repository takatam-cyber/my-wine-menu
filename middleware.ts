import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';
import { verifyJWT } from './lib/auth';

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  const { pathname } = req.nextUrl;

  // ログインページと公開API、アセットは除外
  if (pathname === '/admin/login' || pathname.startsWith('/_next') || pathname === '/') return NextResponse.next();

  const isProtectedRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/wines');

  if (isProtectedRoute) {
    const payload = token ? await verifyJWT(token) : null;
    if (!payload) {
      if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return NextResponse.redirect(new URL('/admin/login', req.url)); // loginへ飛ばす
    }
  }
  return NextResponse.next();
}
