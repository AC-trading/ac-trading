"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeftIcon, CameraIcon } from "@/components/icons";

// 더미 메시지 데이터
const mockMessages = [
  {
    id: 1,
    sender: "me",
    content: "안녕하세요!\n7월 11일 부터 13일까지 빌릴 수 있을까요 ?",
    time: "오후 3:59",
  },
  {
    id: 2,
    sender: "other",
    content: "안녕하세요 가능합니다 !",
    time: "오후 8:46",
  },
];

// 더미 상품 데이터
const mockProduct = {
  id: 1,
  title: "산악자전거 장기대여 가능합니다~!",
  price: 5000,
  status: "빌려주는 중!",
  image: "/images/bike.jpg",
};

// 메시지 버블 컴포넌트 - 물결 배경에 맞춘 색상
function MessageBubble({
  message,
}: {
  message: (typeof mockMessages)[0];
}) {
  const isMe = message.sender === "me";

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-3`}>
      {!isMe && (
        <img
          src="/images/defaults/raccoon.png"
          alt="프로필"
          className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 mr-2 object-cover"
        />
      )}
      <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
        <div
          className={`max-w-[240px] px-4 py-2 rounded-2xl whitespace-pre-line shadow-sm ${
            isMe
              ? "bg-[#7ECEC5] text-white rounded-tr-sm"
              : "bg-white text-gray-800 rounded-tl-sm"
          }`}
        >
          {message.content}
        </div>
        <span className={`text-xs mt-1 ${isMe ? "text-gray-500" : "text-gray-400"}`}>
          {message.time}
        </span>
      </div>
    </div>
  );
}

// 채팅방 페이지 - 물결 배경 UI 적용
export default function ChatRoomPage() {
  const router = useRouter();
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState(mockMessages);
  const [isBottomTabOpen, setIsBottomTabOpen] = useState(false);

  const handleSend = () => {
    if (!inputMessage.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      sender: "me",
      content: inputMessage,
      time: new Date().toLocaleTimeString("ko-KR", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    };

    setMessages([...messages, newMessage]);
    setInputMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-[390px] min-h-screen bg-[#FFFFF0] flex flex-col relative overflow-hidden">
        {/* 헤더 */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
          <div className="flex items-center justify-between h-14 px-4">
            <button
              onClick={() => router.back()}
              className="p-1 -ml-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeftIcon className="text-gray-800" />
            </button>
            <h1 className="font-semibold text-lg">user 1</h1>
            <div className="w-8" /> {/* 균형을 위한 빈 공간 */}
          </div>
        </header>

        {/* 상품 정보 바 */}
        <Link
          href={`/post/${mockProduct.id}`}
          className="relative z-10 flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white hover:bg-gray-50"
        >
          <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center">
            🚲
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 bg-gray-800 text-white rounded">
                {mockProduct.status}
              </span>
              <span className="text-sm text-gray-900 truncate">{mockProduct.title}</span>
            </div>
            <p className="text-sm font-semibold text-gray-900 mt-0.5">
              {mockProduct.price.toLocaleString()}원
            </p>
          </div>
        </Link>

        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto p-4 pb-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </div>

        {/* 입력 영역 + 물결 + 하단탭 (함께 움직임) */}
        <div className="sticky bottom-0 z-20">
          {/* 물결 배경 - 입력창 위에 붙음 */}
          <div className="pointer-events-none">
            <svg
              viewBox="0 0 1440 200"
              className="w-full h-20"
              preserveAspectRatio="none"
            >
              <path
                fill="#BAE8E7"
                d="M0,60
                   C180,100 360,20 540,60
                   C720,100 900,20 1080,60
                   C1260,100 1380,80 1440,60
                   L1440,200 L0,200 Z"
              />
            </svg>
          </div>
          {/* 입력창 */}
          <div className="bg-[#BAE8E7] p-3 -mt-1">
            <div className="flex items-center gap-2">
              {/* + 버튼 (하단탭 토글) */}
              <button
                onClick={() => setIsBottomTabOpen(!isBottomTabOpen)}
                className={`p-2 rounded-full transition-all duration-300 ${
                  isBottomTabOpen
                    ? "bg-white/30 rotate-45"
                    : "text-white/80 hover:text-white"
                }`}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-white"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
              <input
                type="text"
                placeholder="메시지를 입력하세요"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 px-4 py-2 bg-white/90 rounded-full text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <button
                onClick={handleSend}
                disabled={!inputMessage.trim()}
                className="p-2 bg-[#5BBFB3] rounded-full text-white hover:bg-[#4AA89C] disabled:opacity-50"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </div>
          </div>

          {/* 하단 탭 (앨범, 카메라, 약속) */}
          <div
            className={`bg-[#BAE8E7] overflow-hidden transition-all duration-300 ease-in-out ${
              isBottomTabOpen ? "max-h-32 pb-4" : "max-h-0"
            }`}
          >
            <div className="flex justify-around px-4 pt-2">
              {/* 앨범 */}
              <button className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-white/20 transition-colors">
                <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <span className="text-xs text-white font-medium">앨범</span>
              </button>

              {/* 카메라 */}
              <button className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-white/20 transition-colors">
                <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center">
                  <CameraIcon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-white font-medium">카메라</span>
              </button>

              {/* 약속 */}
              <button className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-white/20 transition-colors">
                <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <span className="text-xs text-white font-medium">약속</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
