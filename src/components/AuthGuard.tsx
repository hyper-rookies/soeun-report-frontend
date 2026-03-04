'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isLoggedIn } from '@/lib/auth';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const PUBLIC_PATHS = ['/auth', '/auth/callback'];
    const isPublic = PUBLIC_PATHS.some(
      (p) => pathname === p || pathname.startsWith(p)
    );

    if (isPublic) {
      // /auth: 이미 로그인 상태면 홈으로
      if (pathname === '/auth' && isLoggedIn()) {
        router.replace('/');
      } else {
        setReady(true);
      }
      return;
    }

    if (!isLoggedIn()) {
      router.replace('/auth');
    } else {
      setReady(true);
    }
  }, [pathname, router]);

  if (!ready) return null;
  return <>{children}</>;
}
