"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeftIcon, CameraIcon, MoreVerticalIcon, FlagIcon, BlockIcon, ExitIcon, BellOffIcon, StarIcon } from "@/components/icons";
import { useAuth } from "@/context/AuthContext";
import { webSocketClient, ChatMessage } from "@/lib/websocket";
import { getChatRoom, getChatMessages, formatMessageTime, ChatRoom } from "@/lib/chatApi";
import { blockUser, leaveChatRoom, createReport, ReportReasonCode, reserveChatRoom, unreserveChatRoom, completeChatRoom, formatPrice } from "@/lib/postApi";
import AppointmentModal from "@/components/chat/AppointmentModal";

// 거래 상태 타입
type TradeStatus = "AVAILABLE" | "RESERVED" | "COMPLETED";

// 메시지 타입 (화면 표시용)
interface DisplayMessage {
  id: number;
  senderId: number;
  senderNickname: string;
  content: string | null;
  imageUrl: string | null;
  isMe: boolean;
  time: string;
  isRead: boolean;
}

// 메시지 버블 컴포넌트
// Before: isRead가 true인 모든 내 메시지에 "읽음" 표시
// After: isLastRead prop으로 마지막 읽힌 내 메시지에만 "읽음" 표시
function MessageBubble({ message, isLastRead }: { message: DisplayMessage; isLastRead?: boolean }) {
  return (
    <div className={`flex ${message.isMe ? "justify-end" : "justify-start"} mb-3`}>
      {!message.isMe && (
        <Image
          src={process.env.NEXT_PUBLIC_ICON_ISLAND || "/icons/island.png"}
          alt="프로필"
          width={40}
          height={40}
          className="rounded-full bg-gray-200 flex-shrink-0 mr-2 object-cover"
        />
      )}
      <div className={`flex flex-col ${message.isMe ? "items-end" : "items-start"}`}>
        <div
          className={`max-w-[240px] px-4 py-2 rounded-2xl whitespace-pre-line shadow-sm ${
            message.isMe
              ? "bg-[#7ECEC5] text-white rounded-tr-sm"
              : "bg-[#FFFFF0] text-gray-800 rounded-tl-sm"
          }`}
        >
          {message.imageUrl ? (
            <Image src={message.imageUrl} alt="이미지" width={200} height={200} className="max-w-full rounded object-contain" />
          ) : (
            message.content
          )}
        </div>
        <div className="flex items-center gap-1 mt-1">
          {message.isMe && isLastRead && (
            <span className="text-xs text-gray-400">읽음</span>
          )}
          <span className={`text-xs ${message.isMe ? "text-gray-500" : "text-gray-400"}`}>
            {message.time}
          </span>
        </div>
      </div>
    </div>
  );
}

// 거래 상태 라벨 변환
const getTradeStatusLabel = (status: TradeStatus | undefined) => {
  switch (status) {
    case "AVAILABLE":
      return "거래 가능";
    case "RESERVED":
      return "예약 중";
    case "COMPLETED":
      return "거래 완료";
    default:
      return "거래 가능";
  }
};

// 로딩 스켈레톤
function ChatRoomSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <div className="w-full min-h-screen bg-[#FFFFFF] flex flex-col">
        <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
          <div className="flex items-center justify-between h-14 px-4">
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
            <div className="w-24 h-5 bg-gray-200 rounded animate-pulse" />
            <div className="w-8" />
          </div>
        </header>
        <div className="flex-1 p-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"} mb-3`}>
              <div className="w-48 h-12 bg-gray-200 rounded-2xl animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 채팅방 페이지
export default function ChatRoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = Number(params.id);

  const { isAuthenticated, isLoading: authLoading, accessToken } = useAuth();
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isBottomTabOpen, setIsBottomTabOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Before: currentUserId = Number(user.id) → user.id는 UUID 문자열이라 NaN 반환
  // NaN !== NaN이므로 useEffect deps에서 매 렌더마다 변경 감지 → WebSocket 무한 재연결
  // After: chatRoom.otherUserId(상대방 numeric ID)로 "내 메시지" 판별

  // 더보기 메뉴 상태
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReportReason, setSelectedReportReason] = useState<ReportReasonCode | null>(null);
  const [reportDescription, setReportDescription] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [isBlocking, setIsBlocking] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // 거래 상태 변경 관련 상태
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [isStatusChanging, setIsStatusChanging] = useState(false);

  // 신고 사유 옵션
  const REPORT_REASONS: { code: ReportReasonCode; label: string }[] = [
    { code: "ABUSIVE_LANGUAGE", label: "욕설/비방" },
    { code: "SCAM", label: "사기" },
    { code: "EXTERNAL_MESSENGER", label: "외부 메신저 유도" },
    { code: "OTHER", label: "기타" },
  ];

  // 메시지 목록 스크롤 하단으로
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 메시지 포맷 변환 (API 응답 -> 화면 표시용)
  // Before: isMe를 Number(user.id) === senderId로 판별 → user.id가 UUID라 NaN, 항상 false
  // After: otherUserId와 비교 → senderId !== otherUserId이면 내 메시지
  const formatMessage = (msg: ChatMessage, otherUserId: number | undefined): DisplayMessage => ({
    id: msg.id,
    senderId: msg.senderId,
    senderNickname: msg.senderNickname,
    content: msg.content,
    imageUrl: msg.imageUrl,
    isMe: otherUserId !== undefined && msg.senderId !== otherUserId,
    time: formatMessageTime(msg.createdAt),
    isRead: msg.isRead,
  });

  // 채팅방 정보 및 이전 메시지 로드
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const loadChatRoom = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 채팅방 정보 조회
        const room = await getChatRoom(roomId);
        setChatRoom(room);

        // 이전 메시지 조회
        const prevMessages = await getChatMessages(roomId);
        // getChatMessages는 ChatMessage[] 반환 (chatApi → websocket.ts 동일 타입)
        const formattedMessages = prevMessages.map((msg) =>
          formatMessage(msg, room.otherUserId)
        );
        setMessages(formattedMessages);
      } catch (err) {
        setError(err instanceof Error ? err.message : "채팅방을 불러오는데 실패했습니다");
      } finally {
        setIsLoading(false);
      }
    };

    loadChatRoom();
  }, [isAuthenticated, authLoading, roomId, router]);

  // WebSocket 연결
  useEffect(() => {
    if (!accessToken || !roomId || isLoading) return;

    // WebSocket 연결
    webSocketClient.connect(
      accessToken,
      () => {
        setIsConnected(true);

        // 채팅방 구독
        webSocketClient.subscribeToChatRoom(
          roomId,
          // 새 메시지 수신
          (newMessage: ChatMessage) => {
            const otherUserId = chatRoom?.otherUserId;
            const formattedMessage = formatMessage(newMessage, otherUserId);
            setMessages((prev) => [...prev, formattedMessage]);
            scrollToBottom();

            // 상대방 메시지면 읽음 처리 (otherUserId와 같으면 상대방 메시지)
            if (otherUserId !== undefined && newMessage.senderId === otherUserId) {
              webSocketClient.markAsRead(roomId);
            }
          },
          // 읽음 알림 수신
          () => {
            // 상대방이 읽으면 내 메시지들을 읽음 처리
            setMessages((prev) =>
              prev.map((msg) =>
                msg.isMe ? { ...msg, isRead: true } : msg
              )
            );
          }
        );

        // 입장 시 읽음 처리
        webSocketClient.markAsRead(roomId);
      },
      () => {
        setIsConnected(false);
      }
    );

    // Before: 구독만 해제 → 좀비 WebSocket 연결 잔류
    // After: 구독 해제 + WebSocket 연결 종료
    return () => {
      webSocketClient.unsubscribeFromChatRoom(roomId);
      webSocketClient.disconnect();
    };
  }, [accessToken, roomId, isLoading, chatRoom?.otherUserId]);

  // 읽힌 내 메시지 중 마지막 메시지 ID (읽음 표시는 마지막에만)
  const lastReadMyMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].isMe && messages[i].isRead) return messages[i].id;
    }
    return null;
  }, [messages]);

  // 메시지 변경 시 스크롤
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 메시지 전송
  const handleSend = () => {
    if (!inputMessage.trim() || !isConnected) return;

    webSocketClient.sendMessage({
      chatRoomId: roomId,
      messageType: "TEXT",
      content: inputMessage.trim(),
    });

    setInputMessage("");
  };

  // 엔터키 전송
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 사용자 차단 핸들러
  const handleBlockUser = async () => {
    if (!chatRoom) return;
    if (!confirm("이 사용자를 차단하시겠습니까?")) return;

    setIsBlocking(true);
    try {
      await blockUser(String(chatRoom.otherUserId));
      alert("해당 사용자를 차단했습니다.");
      router.push("/chat");
    } catch (err) {
      console.error("차단 실패:", err);
      alert(err instanceof Error ? err.message : "차단에 실패했습니다");
    } finally {
      setIsBlocking(false);
    }
  };

  // 채팅방 나가기 핸들러
  const handleLeaveChatRoom = async () => {
    if (!confirm("채팅방을 나가시겠습니까? 대화 내용이 삭제됩니다.")) return;

    setIsLeaving(true);
    try {
      await leaveChatRoom(roomId);
      alert("채팅방에서 나왔습니다.");
      router.push("/chat");
    } catch (err) {
      console.error("채팅방 나가기 실패:", err);
      alert(err instanceof Error ? err.message : "채팅방 나가기에 실패했습니다");
    } finally {
      setIsLeaving(false);
    }
  };

  // 약속 잡기 (예약) 핸들러
  const handleReserve = async (scheduledTradeAt: string) => {
    setIsStatusChanging(true);
    try {
      await reserveChatRoom(roomId, scheduledTradeAt);
      // 채팅방 정보 다시 조회하여 상태 반영
      const updatedRoom = await getChatRoom(roomId);
      setChatRoom(updatedRoom);
      setShowAppointmentModal(false);
    } catch (err) {
      console.error("약속 잡기 실패:", err);
      alert(err instanceof Error ? err.message : "약속 잡기에 실패했습니다");
    } finally {
      setIsStatusChanging(false);
    }
  };

  // 예약 취소 핸들러
  const handleUnreserve = async () => {
    if (!confirm("약속을 취소하시겠습니까?")) return;

    setIsStatusChanging(true);
    try {
      await unreserveChatRoom(roomId);
      const updatedRoom = await getChatRoom(roomId);
      setChatRoom(updatedRoom);
    } catch (err) {
      console.error("예약 취소 실패:", err);
      alert(err instanceof Error ? err.message : "예약 취소에 실패했습니다");
    } finally {
      setIsStatusChanging(false);
    }
  };

  // 거래 완료 핸들러
  const handleComplete = async () => {
    setIsStatusChanging(true);
    try {
      await completeChatRoom(roomId);
      const updatedRoom = await getChatRoom(roomId);
      setChatRoom(updatedRoom);
      setShowCompleteConfirm(false);
    } catch (err) {
      console.error("거래 완료 실패:", err);
      alert(err instanceof Error ? err.message : "거래 완료 처리에 실패했습니다");
    } finally {
      setIsStatusChanging(false);
    }
  };

  // 약속 일시 포맷팅
  const formatScheduledTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "오후" : "오전";
    const h12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${month}/${day} ${ampm} ${h12}:${String(minutes).padStart(2, "0")}`;
  };

  // 신고 제출 핸들러
  const handleReportSubmit = async () => {
    if (!chatRoom || !selectedReportReason) return;

    setIsSubmittingReport(true);
    setReportError(null);

    try {
      await createReport({
        postId: chatRoom.postId,
        reasonCode: selectedReportReason,
        description: reportDescription || undefined,
      });
      setShowReportModal(false);
      setSelectedReportReason(null);
      setReportDescription("");
      alert("신고가 접수되었습니다. 검토 후 조치하겠습니다.");
    } catch (err) {
      console.error("신고 실패:", err);
      setReportError(err instanceof Error ? err.message : "신고에 실패했습니다");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // 로딩 중
  if (authLoading || isLoading) {
    return <ChatRoomSkeleton />;
  }

  // 에러 발생
  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <div className="w-full min-h-screen bg-[#FFFFFF] flex flex-col items-center justify-center p-4">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-primary text-white rounded-lg"
          >
            뒤로 가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full min-h-screen bg-[#FFFFFF] flex flex-col relative overflow-hidden">
        {/* 헤더 */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
          <div className="flex items-center justify-between h-14 px-4">
            <button
              onClick={() => router.back()}
              className="p-1 -ml-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeftIcon className="text-black" />
            </button>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-lg">{chatRoom?.otherUserNickname}</h1>
              {!isConnected && (
                <span className="w-2 h-2 bg-yellow-500 rounded-full" title="연결 중..." />
              )}
            </div>
            <button
              onClick={() => setShowMoreMenu(true)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <MoreVerticalIcon className="w-6 h-6 text-black" />
            </button>
          </div>
        </header>

        {/* 상품 정보 바 + 거래 액션 버튼 */}
        {chatRoom && (
          <div className="relative z-10 border-b border-gray-100 bg-white">
            {/* 상품 정보 */}
            <div className="flex items-center gap-3 px-4 py-3">
              <Link
                href={`/post/${chatRoom.postId}`}
                className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80"
              >
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                  {chatRoom.postImageUrl ? (
                    <Image
                      src={chatRoom.postImageUrl}
                      alt={chatRoom.postItemName}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      📦
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      chatRoom.postStatus === "AVAILABLE"
                        ? "bg-[#5BBFB3] text-white"
                        : chatRoom.postStatus === "RESERVED"
                        ? "bg-yellow-500 text-white"
                        : "bg-gray-500 text-white"
                    }`}>
                      {getTradeStatusLabel(chatRoom.postStatus as TradeStatus)}
                    </span>
                    <span className="text-sm text-gray-900 truncate">{chatRoom.postItemName}</span>
                  </div>
                  {chatRoom.postPrice != null && (
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">
                      {formatPrice(chatRoom.postPrice, chatRoom.postCurrencyType)}
                    </p>
                  )}
                </div>
              </Link>
            </div>

            {/* 거래 액션 버튼 (상태별) */}
            {chatRoom.postStatus !== "COMPLETED" && (
              <div className="flex items-center gap-2 px-4 pb-3">
                {/* 판매중 → 약속 잡기 */}
                {chatRoom.postStatus === "AVAILABLE" && (
                  <button
                    onClick={() => setShowAppointmentModal(true)}
                    disabled={isStatusChanging}
                    className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    약속잡기
                  </button>
                )}

                {/* 예약중 → 거래 완료 + 예약 취소 */}
                {chatRoom.postStatus === "RESERVED" && (
                  <>
                    <button
                      onClick={() => setShowCompleteConfirm(true)}
                      disabled={isStatusChanging}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#5BBFB3] text-white rounded-full text-sm font-medium hover:bg-[#4DAE9F] transition-colors disabled:opacity-50"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      거래 완료
                    </button>
                    <button
                      onClick={handleUnreserve}
                      disabled={isStatusChanging}
                      className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      예약 취소
                    </button>
                    {chatRoom.scheduledTradeAt && (
                      <span className="text-xs text-gray-400 ml-auto">
                        {formatScheduledTime(chatRoom.scheduledTradeAt)}
                      </span>
                    )}
                  </>
                )}
              </div>
            )}

            {/* 거래 완료 상태 표시 */}
            {chatRoom.postStatus === "COMPLETED" && (
              <div className="flex items-center gap-2 px-4 pb-3">
                <span className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-500">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  거래 완료됨
                </span>
              </div>
            )}
          </div>
        )}

        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto p-4 pb-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <span className="text-4xl mb-2">💬</span>
              <p>채팅을 시작해보세요!</p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} isLastRead={message.id === lastReadMyMessageId} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 입력 영역 + 물결 + 하단탭 */}
        <div className="sticky bottom-0 z-20">
          {/* 물결 배경 */}
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
              {/* + 버튼 */}
              <button
                onClick={() => setIsBottomTabOpen(!isBottomTabOpen)}
                aria-label={isBottomTabOpen ? "메뉴 닫기" : "메뉴 열기"}
                aria-expanded={isBottomTabOpen}
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
                placeholder={isConnected ? "메시지를 입력하세요" : "연결 중..."}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={!isConnected}
                className="flex-1 px-4 py-2 bg-white/90 rounded-full text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!inputMessage.trim() || !isConnected}
                aria-label="메시지 전송"
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

              {/* 약속 - AVAILABLE 상태에서만 모달 열기 */}
              <button
                onClick={() => {
                  setIsBottomTabOpen(false);
                  if (chatRoom?.postStatus === "AVAILABLE") {
                    setShowAppointmentModal(true);
                  } else if (chatRoom?.postStatus === "RESERVED") {
                    alert("이미 약속이 잡혀있습니다.");
                  } else {
                    alert("거래가 완료된 상품입니다.");
                  }
                }}
                className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-white/20 transition-colors"
              >
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

        {/* 더보기 메뉴 바텀시트 */}
        {showMoreMenu && (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
            onClick={() => setShowMoreMenu(false)}
          >
            <div
              className="w-full bg-white rounded-t-2xl overflow-hidden animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 핸들 바 */}
              <div className="flex justify-center py-3">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>

              {/* 메뉴 아이템들 */}
              <div className="pb-6">
                {/* 매너 평가하기 */}
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    // Before: alert("매너 평가 기능은 준비 중입니다.")
                    // After: 리뷰 페이지로 이동 (postId, revieweeId 전달)
                    if (!chatRoom) return;
                    router.push(`/review?postId=${chatRoom.postId}&revieweeId=${chatRoom.otherUserId}`);
                  }}
                  className="flex items-center gap-3 w-full px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <StarIcon filled={false} className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-800">매너 평가하기</span>
                </button>

                {/* 차단하기 */}
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    handleBlockUser();
                  }}
                  disabled={isBlocking}
                  className="flex items-center gap-3 w-full px-6 py-4 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <BlockIcon className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-800">차단하기</span>
                </button>

                {/* 신고하기 */}
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    setShowReportModal(true);
                  }}
                  className="flex items-center gap-3 w-full px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <FlagIcon className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-800">신고하기</span>
                </button>

                {/* 알림 끄기 */}
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    // TODO: 알림 끄기 기능 구현
                    alert("알림 끄기 기능은 준비 중입니다.");
                  }}
                  className="flex items-center gap-3 w-full px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <BellOffIcon className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-800">알림 끄기</span>
                </button>

                {/* 채팅방 나가기 */}
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    handleLeaveChatRoom();
                  }}
                  disabled={isLeaving}
                  className="flex items-center gap-3 w-full px-6 py-4 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <ExitIcon className="w-5 h-5 text-red-500" />
                  <span className="text-red-500">채팅방 나가기</span>
                </button>
              </div>

              {/* 취소 버튼 */}
              <button
                onClick={() => setShowMoreMenu(false)}
                className="w-full py-4 border-t border-gray-100 text-gray-500 font-medium hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* 신고하기 모달 */}
        {showReportModal && (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
            onClick={() => {
              setShowReportModal(false);
              setSelectedReportReason(null);
              setReportDescription("");
              setReportError(null);
            }}
          >
            <div
              className="w-full bg-white rounded-t-2xl overflow-hidden animate-slide-up max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 헤더 */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold">신고하기</h3>
                <button
                  onClick={() => {
                    setShowReportModal(false);
                    setSelectedReportReason(null);
                    setReportDescription("");
                    setReportError(null);
                  }}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <span className="text-xl text-gray-500">✕</span>
                </button>
              </div>

              {/* 신고 사유 선택 */}
              <div className="p-4 space-y-2">
                <p className="text-sm text-gray-600 mb-3">신고 사유를 선택해주세요</p>
                {REPORT_REASONS.map((reason) => (
                  <button
                    key={reason.code}
                    onClick={() => setSelectedReportReason(reason.code)}
                    className={`w-full px-4 py-3 text-left rounded-lg border transition-colors ${
                      selectedReportReason === reason.code
                        ? "border-[#7ECEC5] bg-[#7ECEC5]/10 text-[#5BBFB3]"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {reason.label}
                  </button>
                ))}
              </div>

              {/* 추가 설명 */}
              {selectedReportReason && (
                <div className="px-4 pb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    추가 설명 (선택)
                  </label>
                  <textarea
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="신고 내용을 자세히 적어주세요"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:border-[#7ECEC5]"
                    rows={3}
                  />
                </div>
              )}

              {/* 에러 메시지 */}
              {reportError && (
                <p className="px-4 pb-2 text-sm text-red-500">{reportError}</p>
              )}

              {/* 제출 버튼 */}
              <div className="p-4 border-t border-gray-100">
                <button
                  onClick={handleReportSubmit}
                  disabled={!selectedReportReason || isSubmittingReport}
                  className="w-full py-4 bg-[#5BBFB3] text-white font-semibold rounded-xl hover:bg-[#4DAE9F] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isSubmittingReport ? "신고 중..." : "신고하기"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 약속 잡기 모달 */}
        {showAppointmentModal && chatRoom && (
          <AppointmentModal
            otherUserNickname={chatRoom.otherUserNickname}
            onConfirm={handleReserve}
            onClose={() => setShowAppointmentModal(false)}
            isSubmitting={isStatusChanging}
          />
        )}

        {/* 거래 완료 확인 모달 */}
        {showCompleteConfirm && (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-8"
            onClick={() => setShowCompleteConfirm(false)}
          >
            <div
              className="w-full max-w-sm bg-white rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  거래 완료
                </h3>
                <p className="text-sm text-gray-500">
                  거래를 완료하시겠습니까?<br />
                  완료 후에는 되돌릴 수 없습니다.
                </p>
              </div>
              <div className="flex border-t border-gray-100">
                <button
                  onClick={() => setShowCompleteConfirm(false)}
                  className="flex-1 py-4 text-gray-500 font-medium hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleComplete}
                  disabled={isStatusChanging}
                  className="flex-1 py-4 text-[#5BBFB3] font-semibold hover:bg-gray-50 transition-colors border-l border-gray-100 disabled:opacity-50"
                >
                  {isStatusChanging ? "처리 중..." : "완료"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
