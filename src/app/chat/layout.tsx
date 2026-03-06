import { Sidebar } from '@/components/layout/Sidebar';

/**
 * 채팅 전용 레이아웃 — Sidebar와 메인 영역을 나란히 배치(flex)하여 
 * 사이드바가 접히고 펼쳐질 때 메인 영역 너비가 유동적으로 변하게 합니다.
 */
export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full w-full overflow-hidden relative">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {children}
      </div>
    </div>
  );
}