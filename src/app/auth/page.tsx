'use client';

import Image from 'next/image';

const COGNITO_DOMAIN =
  'https://ap-northeast-2bzej4aji8.auth.ap-northeast-2.amazoncognito.com';
const CLIENT_ID = '4hlmd3bqam0pjm1kdgv8lt4ki2';

function getRedirectUri(): string {
  if (typeof window === 'undefined') return 'http://localhost:3000/auth/callback';
  return `${window.location.origin}/auth/callback`;
}

function handleGoogleLogin() {
  const redirectUri = getRedirectUri();
  window.location.href =
    `${COGNITO_DOMAIN}/oauth2/authorize?` +
    `client_id=${CLIENT_ID}&` +
    `response_type=code&` +
    `scope=openid+email+profile&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `identity_provider=Google`;
}

export default function AuthPage() {
  return (
    <div
      className="flex-1 flex items-center justify-center px-4"
      style={{ background: 'var(--neutral-50)' }}
    >
      <div
        style={{
          background: 'var(--white)',
          border: '1px solid var(--neutral-100)',
          borderRadius: '16px',
          padding: '40px 32px',
          boxShadow: 'var(--shadow-md)',
          width: '100%',
          maxWidth: '400px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '28px',
        }}
      >
        {/* 로고 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <img
            src="/apple-logo.png"
            alt="AI 리포트 로고"
            width={80}
            height={80}
            style={{ borderRadius: '16px' }}
          />
          <div style={{ textAlign: 'center' }}>
            <h2
              className="text-[20px] font-bold tracking-[-0.02em]"
              style={{ color: 'var(--neutral-700)' }}
            >
              AI 리포트 시스템
            </h2>
            <p
              className="text-[13px]"
              style={{ color: 'var(--neutral-400)', marginTop: '4px' }}
            >
              카카오 · 구글 광고 데이터를 AI로 분석하세요
            </p>
          </div>
        </div>

        {/* 구분선 */}
        <div
          style={{ width: '100%', height: '1px', background: 'var(--neutral-100)' }}
        />

        {/* Google 로그인 버튼 */}
        <button
          onClick={handleGoogleLogin}
          className="cds-btn cds-btn--primary cds-btn--lg"
          style={{ width: '100%' }}
        >
          {/* Google G 아이콘 */}
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
              fill="#fff"
              fillOpacity=".9"
            />
            <path
              d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
              fill="#fff"
              fillOpacity=".75"
            />
            <path
              d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
              fill="#fff"
              fillOpacity=".6"
            />
            <path
              d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
              fill="#fff"
              fillOpacity=".85"
            />
          </svg>
          Google로 로그인
        </button>
      </div>
    </div>
  );
}
