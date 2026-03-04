import { Sidebar } from '@/components/layout/Sidebar';

/**
 * 채팅 전용 레이아웃 — Sidebar가 이 레이아웃 안에서만 렌더링됨
 */
export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />
      {children}
    </>
  );
}
