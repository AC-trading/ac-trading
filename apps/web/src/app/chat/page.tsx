"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MobileLayout, Header } from "@/components/common";
import { RefreshIcon, BellIcon } from "@/components/icons";
import { useAuth } from "@/context/AuthContext";
import { getChatRooms, formatChatTime, ChatRoom } from "@/lib/chatApi";

// 채팅 아이템 컴포넌트
function ChatItem({ chat }: { chat: ChatRoom }) {
  return (
    <Link
      href={`/chat/${chat.id}`}
      className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 relative"
    >
      {/* 프로필 이미지 */}
      <Image
        src={process.env.NEXT_PUBLIC_ICON_RACCOON || "/icons/raccoon_bill.svg"}
        alt="프로필"
        width={48}
        height={48}
        className="rounded-full bg-gray-200 flex-shrink-0 object-cover"
      />

      {/* 채팅 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{chat.otherUserNickname}</span>
          {chat.otherUserIslandName && (
            <span className="text-xs text-gray-400">{chat.otherUserIslandName}</span>
          )}
          <span className="text-xs text-gray-400">· {formatChatTime(chat.lastMessageAt)}</span>
        </div>
        <p className="text-sm text-gray-600 truncate mt-0.5">
          {chat.lastMessage || "채팅을 시작해보세요!"}
        </p>
      </div>

      {/* 상품 정보 표시 */}
      <div className="flex flex-col items-end gap-1">
        <span className="text-xs text-gray-500 max-w-[80px] truncate">
          {chat.postItemName}
        </span>
        {chat.postStatus && (
          <span className={`text-xs px-1.5 py-0.5 rounded ${
            chat.postStatus === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
            chat.postStatus === 'RESERVED' ? 'bg-yellow-100 text-yellow-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {chat.postStatus === 'AVAILABLE' ? '판매중' :
             chat.postStatus === 'RESERVED' ? '예약중' : '완료'}
          </span>
        )}
      </div>

      {/* 안읽은 메시지 표시 */}
      {chat.unreadCount > 0 && (
        <span className="absolute right-4 top-4 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
          {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
        </span>
      )}
    </Link>
  );
}

// 로딩 스켈레톤
function ChatSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4 border-b border-gray-100 animate-pulse">
      <div className="w-12 h-12 rounded-full bg-gray-200" />
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-40" />
      </div>
      <div className="w-12 h-12 rounded-lg bg-gray-200" />
    </div>
  );
}

// 채팅 목록 페이지
export default function ChatListPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 채팅방 목록 조회
  const fetchChatRooms = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getChatRooms();
      setChatRooms(response.chatRooms);
    } catch (err) {
      setError(err instanceof Error ? err.message : "채팅 목록을 불러오는데 실패했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  // 인증 확인 후 채팅방 목록 조회
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    fetchChatRooms();
  }, [isAuthenticated, authLoading, router]);

  // 새로고침
  const handleRefresh = () => {
    fetchChatRooms();
  };

  // 로딩 중
  if (authLoading || isLoading) {
    return (
      <MobileLayout>
        <Header title="채팅" />
        <div>
          {[...Array(5)].map((_, i) => (
            <ChatSkeleton key={i} />
          ))}
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      {/* 헤더 */}
      <Header
        title="채팅"
        rightElement={
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <RefreshIcon className="w-5 h-5 text-gray-800" />
            </button>
            <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <BellIcon className="w-5 h-5 text-gray-800" />
            </button>
          </div>
        }
      />

      {/* 에러 표시 */}
      {error && (
        <div className="p-4 bg-red-50 text-red-600 text-sm">
          {error}
          <button
            onClick={handleRefresh}
            className="ml-2 underline"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 채팅 목록 */}
      <div>
        {chatRooms.map((chat) => (
          <ChatItem key={chat.id} chat={chat} />
        ))}
      </div>

      {/* 채팅 없을 때 빈 상태 */}
      {!error && chatRooms.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <span className="text-6xl mb-4">💬</span>
          <p>아직 채팅이 없어요</p>
          <p className="text-sm mt-1">거래글에서 채팅을 시작해보세요!</p>
        </div>
      )}
    </MobileLayout>
  );
}
