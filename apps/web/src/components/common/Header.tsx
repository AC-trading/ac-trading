"use client";

import { ChevronDownIcon, SearchIcon, MenuIcon, BellIcon, ChevronLeftIcon } from "../icons";

interface HeaderProps {
  title?: string;
  showLocation?: boolean;
  showBack?: boolean;
  showSearch?: boolean;
  showMenu?: boolean;
  showBell?: boolean;
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
  rightElement,
  onBack,
}: HeaderProps) {
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
            <button className="flex items-center gap-1 font-semibold text-lg">
              <span>군자동</span>
              <ChevronDownIcon className="text-gray-600" />
            </button>
          ) : (
            title && <h1 className="font-semibold text-lg">{title}</h1>
          )}
        </div>

        {/* 오른쪽 영역 */}
        <div className="flex items-center gap-3">
          {showSearch && (
            <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <SearchIcon className="text-gray-800" />
            </button>
          )}
          {showMenu && (
            <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <MenuIcon className="text-gray-800" />
            </button>
          )}
          {showBell && (
            <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <BellIcon className="text-gray-800" />
            </button>
          )}
          {rightElement}
        </div>
      </div>
    </header>
  );
}
