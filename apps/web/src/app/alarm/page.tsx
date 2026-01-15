"use client";

import Link from "next/link";
import { MobileLayout, Header } from "@/components/common";
import { RefreshIcon } from "@/components/icons";

// 더미 알림 목록 데이터
const mockAlarms = [
  {
    id: 1,
    type: "keyword",
    title: "키워드 알림",
    message: "'자전거' 키워드로 새 글이 등록되었어요.",
    time: "방금 전",
    product: { image: "/icons/DIY.png" },
    read: false,
  },
  {
    id: 2,
    type: "price",
    title: "가격 인하",
    message: "관심 상품 '에어팟 프로'의 가격이 내려갔어요.",
    time: "1시간 전",
    product: { image: "/icons/bell.png" },
    read: false,
  },
  {
    id: 3,
    type: "chat",
    title: "새 채팅",
    message: "요우님이 메시지를 보냈어요.",
    time: "3시간 전",
    product: { image: "/icons/clothes.png" },
    read: true,
  },
  {
    id: 4,
    type: "like",
    title: "관심 상품",
    message: "관심 등록한 '커피머신'이 판매 완료되었어요.",
    time: "1일 전",
    product: { image: "/icons/fossil.png" },
    read: true,
  },
  {
    id: 5,
    type: "keyword",
    title: "키워드 알림",
    message: "'닌텐도' 키워드로 새 글이 등록되었어요.",
    time: "2일 전",
    product: { image: "/icons/island.png" },
    read: true,
  },
  {
    id: 6,
    type: "system",
    title: "공지사항",
    message: "AC-Trading 서비스 업데이트 안내",
    time: "3일 전",
    product: { image: "/icons/mile ticket.png" },
    read: true,
  },
  {
    id: 7,
    type: "price",
    title: "가격 인하",
    message: "관심 상품 '바이레도 블랑쉬'의 가격이 내려갔어요.",
    time: "1주 전",
    product: { image: "/icons/radish.png" },
    read: true,
  },
  {
    id: 8,
    type: "keyword",
    title: "키워드 알림",
    message: "'아이폰' 키워드로 새 글이 등록되었어요.",
    time: "1주 전",
    product: { image: "/icons/DIY.png" },
    read: true,
  },
  {
    id: 9,
    type: "system",
    title: "이벤트",
    message: "첫 거래 완료 시 포인트 적립 이벤트!",
    time: "2주 전",
    product: { image: "/icons/bell.png" },
    read: true,
  },
];

// 알림 아이템 컴포넌트 (채팅 리스트와 동일한 디자인, 프로필 제외)
function AlarmItem({ alarm }: { alarm: (typeof mockAlarms)[0] }) {
  return (
    <Link
      href={alarm.type === "chat" ? "/chat" : "#"}
      className={`flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
        !alarm.read ? "bg-primary-light/20" : ""
      }`}
    >
      {/* 알림 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{alarm.title}</span>
          <span className="text-xs text-gray-400">· {alarm.time}</span>
          {/* 읽지 않은 알림 표시 */}
          {!alarm.read && (
            <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
          )}
        </div>
        <p className="text-sm text-gray-600 truncate mt-0.5">{alarm.message}</p>
      </div>

      {/* 상품 카테고리 아이콘 */}
      <img
        src={alarm.product?.image || "/icons/DIY.png"}
        alt="알림 아이콘"
        className="w-12 h-12 rounded-lg flex-shrink-0 object-cover bg-gray-100"
      />
    </Link>
  );
}

// 알림 목록 페이지 - 채팅 목록과 동일한 디자인 (프로필 제외)
export default function AlarmListPage() {
  // 읽지 않은 알림 개수
  const unreadCount = mockAlarms.filter((alarm) => !alarm.read).length;

  return (
    <MobileLayout>
      {/* 헤더 */}
      <Header
        title="알림"
        showBack
        onBack={() => window.history.back()}
        rightElement={
          <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <RefreshIcon className="w-5 h-5 text-gray-800" />
          </button>
        }
      />

      {/* 읽지 않은 알림 개수 표시 */}
      {unreadCount > 0 && (
        <div className="px-4 py-2 bg-primary-light/30 text-primary text-sm font-medium">
          읽지 않은 알림 {unreadCount}개
        </div>
      )}

      {/* 알림 목록 */}
      <div>
        {mockAlarms.map((alarm) => (
          <AlarmItem key={alarm.id} alarm={alarm} />
        ))}
      </div>

      {/* 알림 없을 때 빈 상태 */}
      {mockAlarms.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <span className="text-6xl mb-4">🔔</span>
          <p>아직 알림이 없어요</p>
          <p className="text-sm mt-1">새로운 소식이 오면 알려드릴게요!</p>
        </div>
      )}
    </MobileLayout>
  );
}
