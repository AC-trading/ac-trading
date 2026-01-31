"use client";

import BottomNav from "./BottomNav";

interface MobileLayoutProps {
  children: React.ReactNode;
  hideNav?: boolean;
}

// 반응형 웹 레이아웃
// - 전체 너비 사용 (웹 페이지처럼 보이도록)
export default function MobileLayout({ children, hideNav = false }: MobileLayoutProps) {
  return (
    <div className="w-full min-h-screen bg-white">
      <main className={`w-full ${hideNav ? "" : "pb-20"}`}>{children}</main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
