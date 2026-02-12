"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { MobileLayout, Header } from "@/components/common";
import { RefreshIcon } from "@/components/icons";
import { useAuth } from "@/context/AuthContext";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  formatRelativeTime,
  NotificationItem,
} from "@/lib/postApi";

// 알림 타입별 링크 생성
function getAlarmLink(alarm: NotificationItem): string {
  // referenceType과 referenceId로 이동할 페이지 결정
  switch (alarm.referenceType) {
    case "CHAT_ROOM":
      return alarm.referenceId ? `/chat/${alarm.referenceId}` : "/chat";
    case "POST":
      return alarm.referenceId ? `/post/${alarm.referenceId}` : "/";
    default:
      return "#";
  }
}

// 알림 아이템 컴포넌트
function AlarmItem({
  alarm,
  onRead,
}: {
  alarm: NotificationItem;
  onRead: (id: number) => void;
}) {
  const handleClick = () => {
    if (!alarm.isRead) {
      onRead(alarm.id);
    }
  };

  return (
    <Link
      href={getAlarmLink(alarm)}
      onClick={handleClick}
      className={`flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
        !alarm.isRead ? "bg-primary-light/20" : ""
      }`}
    >
      {/* 알림 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-black">{alarm.title}</span>
          <span className="text-xs text-black">
            · {formatRelativeTime(alarm.createdAt)}
          </span>
          {/* 읽지 않은 알림 표시 */}
          {!alarm.isRead && (
            <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
          )}
        </div>
        {alarm.content && (
          <p className="text-sm text-black truncate mt-0.5">{alarm.content}</p>
        )}
      </div>

      {/* 상품 카테고리 아이콘 */}
      <Image
        src={process.env.NEXT_PUBLIC_ICON_ISLAND || "/icons/island.png"}
        alt="알림 아이콘"
        width={48}
        height={48}
        className="w-12 h-12 rounded-lg flex-shrink-0 object-cover bg-gray-100"
      />
    </Link>
  );
}

// 알림 목록 페이지 - 더미 데이터 제거, 실제 API 연동
export default function AlarmListPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [alarms, setAlarms] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 알림 목록 로드
  const loadAlarms = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getNotifications(0, 50);
      setAlarms(response.notifications);
      setUnreadCount(response.unreadCount);
    } catch (err) {
      console.error("알림 로드 실패:", err);
      setError(
        err instanceof Error ? err.message : "알림을 불러오는데 실패했습니다"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadAlarms();
    } else if (!authLoading && !isAuthenticated) {
      setIsLoading(false);
    }
  }, [authLoading, isAuthenticated]);

  // 개별 알림 읽음 처리
  const handleRead = async (id: number) => {
    try {
      await markNotificationAsRead(id);
      setAlarms((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isRead: true } : a))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("알림 읽음 처리 실패:", err);
    }
  };

  // 모든 알림 읽음 처리
  const handleReadAll = async () => {
    if (unreadCount === 0) return;
    try {
      await markAllNotificationsAsRead();
      setAlarms((prev) =>
        prev.map((a) => ({ ...a, isRead: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error("모든 알림 읽음 처리 실패:", err);
    }
  };

  return (
    <MobileLayout>
      {/* 헤더 */}
      <Header
        title="알림"
        showBack
        onBack={() => window.history.back()}
        rightElement={
          <button
            onClick={loadAlarms}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <RefreshIcon className="w-5 h-5 text-black" />
          </button>
        }
      />

      {/* 비로그인 상태 */}
      {!authLoading && !isAuthenticated && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <span className="text-6xl mb-4">🔒</span>
          <p>로그인이 필요합니다</p>
          <Link
            href="/login"
            className="mt-4 px-4 py-2 text-sm text-primary hover:underline"
          >
            로그인하기
          </Link>
        </div>
      )}

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* 에러 상태 */}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <p className="text-sm">{error}</p>
          <button
            onClick={loadAlarms}
            className="mt-4 px-4 py-2 text-sm text-primary hover:underline"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 읽지 않은 알림 개수 + 모두 읽기 */}
      {!isLoading && !error && isAuthenticated && alarms.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-primary-light/30">
          {unreadCount > 0 ? (
            <span className="text-primary text-sm font-medium">
              읽지 않은 알림 {unreadCount}개
            </span>
          ) : (
            <span className="text-gray-500 text-sm">
              모든 알림을 확인했습니다
            </span>
          )}
          {unreadCount > 0 && (
            <button
              onClick={handleReadAll}
              className="text-xs text-primary hover:underline"
            >
              모두 읽기
            </button>
          )}
        </div>
      )}

      {/* 알림 목록 */}
      {!isLoading && !error && isAuthenticated && alarms.length > 0 && (
        <div>
          {alarms.map((alarm) => (
            <AlarmItem key={alarm.id} alarm={alarm} onRead={handleRead} />
          ))}
        </div>
      )}

      {/* 알림 없을 때 빈 상태 */}
      {!isLoading && !error && isAuthenticated && alarms.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <span className="text-6xl mb-4">🔔</span>
          <p>아직 알림이 없어요</p>
          <p className="text-sm mt-1">새로운 소식이 오면 알려드릴게요!</p>
        </div>
      )}
    </MobileLayout>
  );
}
