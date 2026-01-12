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

// 메시지 버블 컴포넌트
function MessageBubble({
  message,
}: {
  message: (typeof mockMessages)[0];
}) {
  const isMe = message.sender === "me";

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-3`}>
      {!isMe && (
        <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 mr-2 flex items-center justify-center">
          👤
        </div>
      )}
      <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
        <div
          className={`max-w-[240px] px-4 py-2 rounded-2xl whitespace-pre-line ${
            isMe
              ? "bg-primary text-white rounded-tr-none"
              : "bg-gray-100 text-gray-900 rounded-tl-none"
          }`}
        >
          {message.content}
        </div>
        <span className="text-xs text-gray-400 mt-1">{message.time}</span>
      </div>
    </div>
  );
}

// 채팅방 페이지 - Figma 디자인 기반
export default function ChatRoomPage() {
  const router = useRouter();
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState(mockMessages);

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
      <div className="w-full max-w-[390px] min-h-screen bg-white flex flex-col">
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
          className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50"
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
        <div className="flex-1 overflow-y-auto p-4 bg-white">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </div>

        {/* 입력 영역 */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-3">
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-500 hover:text-gray-700">
              <CameraIcon />
            </button>
            <input
              type="text"
              placeholder="메시지를 입력하세요"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={handleSend}
              disabled={!inputMessage.trim()}
              className="p-2 text-primary hover:text-primary-dark disabled:text-gray-300"
            >
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
