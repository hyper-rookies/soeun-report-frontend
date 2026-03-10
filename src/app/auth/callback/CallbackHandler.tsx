'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setAccessToken } from '@/lib/auth';

const MESSAGES = [
  'Google 계정을 확인하고 있어요.',
  'TIP. 대시보드를 보지 말고, 대화하세요.',
  'TIP. 주간리포트 엑셀 Export 기능을 활용하세요.',
  'TIP. 채팅방의 읽기 전용 URL을 공유하세요.',
];

export default function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const called = useRef(false);
  const [msgIndex, setMsgIndex] = useState(0);
  const [visible, setVisible] = useState(true);

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

  useEffect(() => {
    if (msgIndex >= MESSAGES.length - 1) return;
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setMsgIndex((i) => Math.min(i + 1, MESSAGES.length - 1));
        setVisible(true);
      }, 300);
    }, 1500);
    return () => clearInterval(timer);
  }, [msgIndex]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white gap-10">
      {/* 서비스명 */}
      <div className="flex flex-col items-center gap-1">
        <span
          className="text-2xl font-black tracking-tight"
          style={{ color: 'var(--primary-500)' }}
        >
          SE Report
        </span>
        <span
          className="text-xs font-medium"
          style={{ color: 'var(--neutral-400)' }}
        >
          AI 광고 리포트 서비스
        </span>
      </div>

      {/* 메시지 + 프로그레스 바 */}
      <div className="flex flex-col items-center gap-5 w-full max-w-sm px-8">
        <p
          className="text-sm font-medium text-center"
          style={{
            color: 'var(--neutral-500)',
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.3s ease',
            minHeight: '1.5rem',
          }}
        >
          {MESSAGES[msgIndex]}
        </p>
        <div
          className="w-full rounded-full overflow-hidden"
          style={{ height: '3px', backgroundColor: 'var(--neutral-100)' }}
        >
          <div
            className="h-full rounded-full callback-progress"
            style={{ backgroundColor: 'var(--primary-500)' }}
          />
        </div>
      </div>
    </div>
  );
}
