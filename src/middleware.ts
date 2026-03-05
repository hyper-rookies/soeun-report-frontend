import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 인증 불필요한 경로 (명시적으로 전부 나열)
  const publicPaths = ['/auth', '/auth/callback', '/shared'];
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
  // png, svg, jpg 등 정적 이미지 파일 확장자를 미들웨어 검사(토큰 검사)에서 제외하도록 추가
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};