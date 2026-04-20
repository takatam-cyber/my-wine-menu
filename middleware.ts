// middleware.ts (修正版)
export async function middleware(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  const { pathname, searchParams } = req.nextUrl;

  if (pathname === '/admin') return NextResponse.next();

  // ★重要：api/wines かつ slugパラメータがある場合は、お客様のアクセスなので通す
  if (pathname === '/api/wines' && searchParams.has('slug')) {
    return NextResponse.next();
  }

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
