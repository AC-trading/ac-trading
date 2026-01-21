"use client";

import Link from "next/link";
import { SearchIcon, MenuIcon, BellIcon, ChevronLeftIcon } from "../icons";
import { useAuth } from "@/context/AuthContext";

interface HeaderProps {
  title?: string;
  showLocation?: boolean;
  showBack?: boolean;
  showSearch?: boolean;
  showMenu?: boolean;
  showBell?: boolean;
  showAuth?: boolean;
  rightElement?: React.ReactNode;
  onBack?: () => void;
}

export default function Header({
  title,
  showLocation = false,
  showBack = false,
  showSearch = false,
  showMenu = false,
  showBell = false,
  showAuth = true,
  rightElement,
  onBack,
}: HeaderProps) {
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
      <div className="flex items-center justify-between h-14 px-4">
        {/* 왼쪽 영역 */}
        <div className="flex items-center gap-2">
          {showBack && (
            <button
              onClick={onBack}
              className="p-1 -ml-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeftIcon className="text-gray-800" />
            </button>
          )}
          {showLocation ? (
            <span className="font-semibold text-lg">
              {isAuthenticated && user?.islandName ? user.islandName : "내 섬"}
            </span>
          ) : (
            title && <h1 className="font-semibold text-lg">{title}</h1>
          )}
        </div>

        {/* 오른쪽 영역 */}
        <div className="flex items-center gap-3">
          {showSearch && (
            <Link href="/search" className="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <SearchIcon className="text-gray-800" />
            </Link>
          )}
          {showMenu && (
            <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <MenuIcon className="text-gray-800" />
            </button>
          )}
          {showBell && (
            <Link href="/alarm" className="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <BellIcon className="text-gray-800" />
            </Link>
          )}

          {/* 인증 상태 표시 */}
          {showAuth && !isLoading && (
            <>
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt="프로필"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-primary text-sm font-medium">
                        {user?.nickname?.charAt(0) || user?.email?.charAt(0) || "?"}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={logout}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    로그아웃
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="text-sm font-medium text-primary hover:text-primary/80"
                >
                  로그인
                </Link>
              )}
            </>
          )}

          {rightElement}
        </div>
      </div>
    </header>
  );
}
