'use client';
import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setAccessToken } from '@/lib/auth';

export default function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const code = searchParams.get('code');
    if (!code) {
      router.replace('/auth');
      return;
    }

    const redirectUri = window.location.origin + '/auth/callback';
    const apiUrl = '/api/auth/callback';

    fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirectUri }),
    })
      .then((res) => res.json())
      .then((data) => {
        const accessToken = data.accessToken ?? data.data?.accessToken;
        if (accessToken) {
          setAccessToken(accessToken);
          router.replace('/');
        } else {
          router.replace('/auth');
        }
      })
      .catch(() => router.replace('/auth'));
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500">로그인 처리 중...</p>
    </div>
  );
}
