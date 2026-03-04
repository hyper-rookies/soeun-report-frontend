import { Suspense } from 'react';
import CallbackHandler from './CallbackHandler';

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-500">로그인 처리 중...</p>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
