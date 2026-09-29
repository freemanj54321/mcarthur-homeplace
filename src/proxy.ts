import { NextResponse, type NextRequest } from 'next/server'

// MCA-61: Next 16 renamed `middleware` to `proxy`, and the file must sit at the
// same level as `app/` (here `src/`). The old root-level `middleware.ts` still
// ran in production builds but was ignored by `next dev`, so E2E never saw the
// `?next=` redirect. Pages still call requireEditor() as the real auth check;
// this only gives signed-out visitors a login redirect that remembers the path.
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (pathname === '/admin/login') return NextResponse.next()

  const hasSession = Boolean(req.cookies.get('__session')?.value)
  if (hasSession) return NextResponse.next()

  const url = req.nextUrl.clone()
  url.pathname = '/admin/login'
  url.searchParams.set('next', pathname)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/admin/:path*'],
}
