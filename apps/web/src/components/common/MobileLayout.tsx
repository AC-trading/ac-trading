"use client";

import BottomNav from "./BottomNav";

interface MobileLayoutProps {
  children: React.ReactNode;
  hideNav?: boolean;
}

// 모바일 앱 레이아웃
// Before: 390px 고정 너비 (최신 폰에서 회색 여백 발생)
// After: 전체 너비 사용 (반응형)
export default function MobileLayout({ children, hideNav = false }: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      <div className="w-full min-h-screen bg-white relative">
        <main className={`${hideNav ? "" : "pb-20"}`}>{children}</main>
        {!hideNav && <BottomNav />}
      </div>
    </div>
  );
}
