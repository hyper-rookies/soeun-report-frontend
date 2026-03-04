import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 인증 불필요한 경로 (명시적으로 전부 나열)
  const publicPaths = ['/auth', '/auth/callback'];
  const isPublic = publicPaths.some((p) => pathname === p || pathname.startsWith(p));

  if (isPublic) {
    return NextResponse.next();
  }

  // 토큰 체크
  const token = request.cookies.get('accessToken')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
