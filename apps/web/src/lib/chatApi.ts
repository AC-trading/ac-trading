import { ChatMessage } from './websocket';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// 채팅방 응답 타입
export interface ChatRoom {
  id: number;
  postId: number;
  postItemName: string;
  postImageUrl: string | null;
  postPrice: number | null;
  postStatus: string | null;
  otherUserId: number;
  otherUserNickname: string;
  otherUserIslandName: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  status: string;
  scheduledTradeAt: string | null;
  createdAt: string;
}

// 채팅방 목록 응답 타입
export interface ChatRoomListResponse {
  chatRooms: ChatRoom[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// API 에러 응답 타입
interface ApiError {
  error: string;
  message: string;
}

// 공통 fetch 함수
async function fetchWithAuth<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const accessToken = localStorage.getItem('accessToken');

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      ...options.headers,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({
      error: 'UNKNOWN_ERROR',
      message: '알 수 없는 오류가 발생했습니다',
    }));
    throw new Error(errorData.message);
  }

  return response.json();
}

// 채팅방 목록 조회
export async function getChatRooms(page = 0, size = 20): Promise<ChatRoomListResponse> {
  return fetchWithAuth<ChatRoomListResponse>(
    `${API_URL}/api/chat/rooms?page=${page}&size=${size}`
  );
}

// 채팅방 상세 조회
export async function getChatRoom(roomId: number): Promise<ChatRoom> {
  return fetchWithAuth<ChatRoom>(`${API_URL}/api/chat/rooms/${roomId}`);
}

// 채팅방 생성 (게시글에서 채팅 시작)
export async function createChatRoom(postId: number): Promise<ChatRoom> {
  return fetchWithAuth<ChatRoom>(`${API_URL}/api/chat/rooms`, {
    method: 'POST',
    body: JSON.stringify({ postId }),
  });
}

// 채팅 메시지 목록 조회 (이전 메시지)
export async function getChatMessages(roomId: number): Promise<ChatMessage[]> {
  return fetchWithAuth<ChatMessage[]>(`${API_URL}/api/chat/rooms/${roomId}/messages`);
}

// 시간 포맷팅 (채팅 목록용)
export function formatChatTime(dateString: string | null): string {
  if (!dateString) return '';

  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return '방금';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;

  // 7일 이상이면 날짜 표시
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

// 시간 포맷팅 (채팅방 내부용)
export function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? '오후' : '오전';
  const hour12 = hours % 12 || 12;

  return `${ampm} ${hour12}:${minutes.toString().padStart(2, '0')}`;
}
