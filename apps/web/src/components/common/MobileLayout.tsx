"use client";

import BottomNav from "./BottomNav";

interface MobileLayoutProps {
  children: React.ReactNode;
  hideNav?: boolean;
}

// 모바일 앱 레이아웃 - 390px 고정 너비, 중앙 정렬
export default function MobileLayout({ children, hideNav = false }: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-[390px] min-h-screen bg-white relative shadow-lg">
        <main className={`${hideNav ? "" : "pb-20"}`}>{children}</main>
        {!hideNav && <BottomNav />}
      </div>
    </div>
  );
}
