import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. 정적 리소스 및 이미지 파일 예외 처리 (확실하게 통과)
  if (
    pathname.match(/\.(?:svg|png|jpg|jpeg|gif|webp)$/) ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/_next/')
  ) {
    return NextResponse.next();
  }

  // 2. 인증 불필요한 페이지 경로
  const publicPaths = ['/auth', '/auth/callback', '/shared'];
  const isPublic = publicPaths.some((p) => pathname === p || pathname.startsWith(p));

  if (isPublic) {
    return NextResponse.next();
  }

  // 3. 토큰 체크
  const token = request.cookies.get('accessToken')?.value;
  if (!token) {
    // 🍎 중요: 정적 파일이 리다이렉트되지 않도록 한 번 더 방어
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // matcher는 현재 그대로 유지하셔도 무방하지만, 
  // 내부 로직에서 한 번 더 걸러주는 것이 브랜치 병합 시 발생하는 오류를 막는 데 효과적입니다.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};