"use client";

import Link from "next/link";
import { MobileLayout, Header } from "@/components/common";
import { RefreshIcon, BellIcon } from "@/components/icons";

// 더미 채팅 목록 데이터
const mockChats = [
  {
    id: 1,
    user: { name: "요우", location: "군자동", avatar: "🧑" },
    lastMessage: "감사합니다!! 조심히가세요!",
    time: "1주 전",
    product: { image: "/images/product1.jpg" },
    unread: 0,
  },
  {
    id: 2,
    user: { name: "요이키", location: "문정동", avatar: "👩" },
    lastMessage: "확인했습니다 감사합니다 :)",
    time: "1주 전",
    product: { image: "/images/product2.jpg" },
    unread: 0,
  },
  {
    id: 3,
    user: { name: "chan", location: "구의동", avatar: "🧔" },
    lastMessage: "넵 수고하세용",
    time: "2주 전",
    product: { image: "/images/product3.jpg" },
    unread: 0,
  },
  {
    id: 4,
    user: { name: "오지", location: "보문동2가", avatar: "👦" },
    lastMessage: "안녕하세요 답장이 너무 늦었네여 죄송...",
    time: "1달 전",
    product: { image: "/images/product4.jpg" },
    unread: 0,
  },
  {
    id: 5,
    user: { name: "누룽지", location: "면목동", avatar: "👧" },
    lastMessage: "이랍다님이 이모티콘을 보냈어요.",
    time: "1달 전",
    product: { image: "/images/product5.jpg" },
    unread: 0,
  },
  {
    id: 6,
    user: { name: "kenny", location: "자양제4동", avatar: "🧑‍🦱" },
    lastMessage: "네.",
    time: "3달 전",
    product: { image: "/images/product6.jpg" },
    unread: 0,
  },
  {
    id: 7,
    user: { name: "자리보금", location: "옥수동", avatar: "👨" },
    lastMessage: "자리보금님이 이모티콘을 보냈어요.",
    time: "3달 전",
    product: { image: "/images/product7.jpg" },
    unread: 0,
  },
  {
    id: 8,
    user: { name: "리빙스턴", location: "면목동", avatar: "🧓" },
    lastMessage: "리빙스턴님이 이모티콘을 보냈어요.",
    time: "6달 전",
    product: { image: "/images/product8.jpg" },
    unread: 0,
  },
  {
    id: 9,
    user: { name: "까룽이", location: "중곡동", avatar: "👶" },
    lastMessage: "옷 예쁘네요!",
    time: "7달 전",
    product: { image: "/images/product9.jpg" },
    unread: 0,
  },
];

// 채팅 아이템 컴포넌트
function ChatItem({ chat }: { chat: (typeof mockChats)[0] }) {
  return (
    <Link
      href={`/chat/${chat.id}`}
      className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100"
    >
      {/* 프로필 이미지 */}
      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-2xl flex-shrink-0">
        {chat.user.avatar}
      </div>

      {/* 채팅 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{chat.user.name}</span>
          <span className="text-xs text-gray-400">{chat.user.location}</span>
          <span className="text-xs text-gray-400">· {chat.time}</span>
        </div>
        <p className="text-sm text-gray-600 truncate mt-0.5">{chat.lastMessage}</p>
      </div>

      {/* 상품 이미지 */}
      <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center text-gray-400">
        📦
      </div>

      {/* 안읽은 메시지 표시 */}
      {chat.unread > 0 && (
        <div className="absolute right-16 top-1/2 -translate-y-1/2">
          <span className="w-5 h-5 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
            {chat.unread}
          </span>
        </div>
      )}
    </Link>
  );
}

// 채팅 목록 페이지 - Figma 디자인 기반
export default function ChatListPage() {
  return (
    <MobileLayout>
      {/* 헤더 */}
      <Header
        title="채팅"
        rightElement={
          <div className="flex items-center gap-2">
            <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <RefreshIcon className="w-5 h-5 text-gray-800" />
            </button>
            <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <BellIcon className="w-5 h-5 text-gray-800" />
            </button>
          </div>
        }
      />

      {/* 채팅 목록 */}
      <div>
        {mockChats.map((chat) => (
          <ChatItem key={chat.id} chat={chat} />
        ))}
      </div>

      {/* 채팅 없을 때 빈 상태 */}
      {mockChats.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <span className="text-6xl mb-4">💬</span>
          <p>아직 채팅이 없어요</p>
          <p className="text-sm mt-1">거래글에서 채팅을 시작해보세요!</p>
        </div>
      )}
    </MobileLayout>
  );
}
