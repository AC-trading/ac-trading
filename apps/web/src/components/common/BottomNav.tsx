"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, ChatIcon, UserIcon } from "../icons";

// 하단 네비게이션 아이템 정의
const navItems = [
  { href: "/", label: "홈", icon: HomeIcon },
  { href: "/chat", label: "채팅", icon: ChatIcon },
  { href: "/profile", label: "내 프로필", icon: UserIcon },
];

export default function BottomNav() {
  const pathname = usePathname();

  // 로그인/회원가입 페이지에서는 네비게이션 숨김
  if (pathname === "/login" || pathname === "/signup") {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center w-full h-full gap-1"
            >
              <Icon active={isActive} />
              <span
                className={`text-xs ${
                  isActive ? "text-primary font-medium" : "text-black"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
      {/* 아이폰 하단 safe area 여백 - 모바일에서만 표시 */}
      <div className="h-2 md:h-0" />
    </nav>
  );
}
