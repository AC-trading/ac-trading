// 게시글 및 카테고리 API 서비스
// 백엔드 /api/posts, /api/categories 엔드포인트와 연동

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// ========== 카테고리 타입 정의 ==========

// 카테고리 응답 타입
export interface Category {
  id: number;
  name: string;
  sortOrder: number;
}

// 카테고리 목록 응답 타입
export interface CategoryListResponse {
  categories: Category[];
}

// ========== 타입 정의 ==========

// 게시글 응답 타입
export interface Post {
  id: number;
  userId: number;
  userNickname: string | null;
  userIslandName: string | null;
  userMannerScore: number | null;

  postType: 'SELL' | 'BUY';
  status: 'AVAILABLE' | 'RESERVED' | 'COMPLETED';

  categoryId: number;
  categoryName: string | null;

  itemName: string;
  currencyType: 'BELL' | 'MILE_TICKET' | null;
  price: number | null;
  priceNegotiable: boolean | null;
  description: string;

  likeCount: number;
  isLiked: boolean;

  bumpedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// 게시글 목록 응답 타입
export interface PostListResponse {
  posts: Post[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// 게시글 작성 요청 타입
export interface PostCreateRequest {
  postType: 'SELL' | 'BUY';
  categoryId: number;
  itemName: string;
  currencyType?: 'BELL' | 'MILE_TICKET';
  price?: number;
  priceNegotiable?: boolean;
  description: string;
}

// 게시글 수정 요청 타입
export interface PostUpdateRequest {
  categoryId?: number;
  itemName?: string;
  currencyType?: 'BELL' | 'MILE_TICKET';
  price?: number;
  priceNegotiable?: boolean;
  description?: string;
}

// 게시글 상태 변경 요청 타입
export interface PostStatusUpdateRequest {
  status: 'AVAILABLE' | 'RESERVED' | 'COMPLETED';
}

// ========== 가격 제안 타입 정의 ==========

// 가격 제안 요청 타입
export interface PriceOfferCreateRequest {
  offeredPrice: number;
  currencyType?: 'BELL' | 'MILE_TICKET';
}

// 가격 제안 응답 타입
export interface PriceOfferResponse {
  id: number;
  postId: number;
  postItemName: string | null;
  offererId: number;
  offererNickname: string | null;
  offererIslandName: string | null;
  offeredPrice: number;
  currencyType: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
}

// 가격 제안 수락 응답 타입
export interface PriceOfferAcceptResponse {
  offerId: number;
  status: string;
  chatRoomId: number;
  message: string;
}

// ========== 리뷰 타입 정의 ==========

// 리뷰 작성 요청 타입
export interface ReviewCreateRequest {
  postId: number;
  revieweeId: number;
  rating: number; // 0-5
  comment?: string;
}

// 리뷰 응답 타입
export interface ReviewResponse {
  id: number;
  postId: number;
  postItemName: string | null;
  reviewerId: number;
  reviewerNickname: string | null;
  reviewerIslandName: string | null;
  revieweeId: number;
  revieweeNickname: string | null;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

// 리뷰 목록 응답 타입
export interface ReviewListResponse {
  reviews: ReviewResponse[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// ========== 채팅 타입 정의 ==========

// 채팅방 응답 타입
export interface ChatRoom {
  id: number;
  postId: number;
  postItemName: string | null;
  postStatus: 'AVAILABLE' | 'RESERVED' | 'COMPLETED';
  sellerId: number;
  sellerNickname: string | null;
  buyerId: number;
  buyerNickname: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  createdAt: string;
}

// 채팅방 목록 응답 타입
export interface ChatRoomListResponse {
  rooms: ChatRoom[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
  hasNext: boolean;
}

// 채팅 메시지 응답 타입
export interface ChatMessage {
  id: number;
  roomId: number;
  senderId: number;
  senderNickname: string | null;
  content: string;
  isRead: boolean;
  createdAt: string;
}

// 채팅 메시지 목록 응답 타입
export interface ChatMessageListResponse {
  messages: ChatMessage[];
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
}

// 채팅방 생성 요청 타입
export interface ChatRoomCreateRequest {
  postId: number;
  initialMessage?: string;
}

// ========== 차단 타입 정의 ==========

// 차단된 사용자 응답 타입
export interface BlockedUser {
  id: number;
  blockedUserId: string;
  blockedUserNickname: string | null;
  blockedAt: string;
}

// 차단 목록 응답 타입
export interface BlockListResponse {
  blocks: BlockedUser[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
  hasNext: boolean;
}

// ========== 신고 타입 정의 ==========

// 신고 사유 코드
export type ReportReasonCode =
  | 'HACKED_ITEM'
  | 'DUPLICATE_POST'
  | 'ABUSIVE_LANGUAGE'
  | 'REAL_MONEY_TRADE'
  | 'SCAM'
  | 'EXTERNAL_MESSENGER'
  | 'OTHER';

// 신고 요청 타입
export interface ReportCreateRequest {
  postId: number;
  reasonCode: ReportReasonCode;
  description?: string;
  blockUser?: boolean;
}

// 신고 응답 타입
export interface ReportResponse {
  id: number;
  postId: number;
  reporterId: number;
  reasonCode: string;
  description: string | null;
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED';
  createdAt: string;
}

// API 에러 응답 타입
interface ApiError {
  error: string;
  message: string;
}

// ========== 유틸리티 함수 ==========

/**
 * localStorage에서 accessToken 조회 (SSR 환경 대응)
 */
function getAccessToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem('accessToken');
}

/**
 * 공통 fetch 함수 (인증 헤더 포함)
 */
async function fetchWithAuth<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const accessToken = getAccessToken();

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

// ========== 카테고리 API 함수 ==========

/**
 * 카테고리 목록 조회
 * GET /api/categories
 */
export async function getCategories(): Promise<CategoryListResponse> {
  const response = await fetch(`${API_URL}/api/categories`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('카테고리를 불러오는데 실패했습니다');
  }

  return response.json();
}

// ========== 게시글 API 함수 ==========

/**
 * 게시글 목록 조회 (피드)
 * GET /api/posts
 */
export async function getPosts(params?: {
  categoryId?: number;
  postType?: 'SELL' | 'BUY';
  status?: 'AVAILABLE' | 'RESERVED' | 'COMPLETED';
  currencyType?: 'BELL' | 'MILE_TICKET';
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  size?: number;
}): Promise<PostListResponse> {
  const searchParams = new URLSearchParams();

  if (params?.categoryId) searchParams.set('categoryId', String(params.categoryId));
  if (params?.postType) searchParams.set('postType', params.postType);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.currencyType) searchParams.set('currencyType', params.currencyType);
  if (params?.minPrice !== undefined) searchParams.set('minPrice', String(params.minPrice));
  if (params?.maxPrice !== undefined) searchParams.set('maxPrice', String(params.maxPrice));
  if (params?.page !== undefined) searchParams.set('page', String(params.page));
  if (params?.size !== undefined) searchParams.set('size', String(params.size));

  const queryString = searchParams.toString();
  const url = `${API_URL}/api/posts${queryString ? `?${queryString}` : ''}`;

  return fetchWithAuth<PostListResponse>(url);
}

/**
 * 게시글 검색
 * GET /api/posts/search
 */
export async function searchPosts(params: {
  keyword: string;
  categoryId?: number;
  postType?: 'SELL' | 'BUY';
  status?: 'AVAILABLE' | 'RESERVED' | 'COMPLETED';
  currencyType?: 'BELL' | 'MILE_TICKET';
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  size?: number;
}): Promise<PostListResponse> {
  const searchParams = new URLSearchParams();

  searchParams.set('keyword', params.keyword);
  if (params.categoryId) searchParams.set('categoryId', String(params.categoryId));
  if (params.postType) searchParams.set('postType', params.postType);
  if (params.status) searchParams.set('status', params.status);
  if (params.currencyType) searchParams.set('currencyType', params.currencyType);
  if (params.minPrice !== undefined) searchParams.set('minPrice', String(params.minPrice));
  if (params.maxPrice !== undefined) searchParams.set('maxPrice', String(params.maxPrice));
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.size !== undefined) searchParams.set('size', String(params.size));

  return fetchWithAuth<PostListResponse>(`${API_URL}/api/posts/search?${searchParams.toString()}`);
}

/**
 * 내 게시글 목록 조회
 * GET /api/posts/me
 */
export async function getMyPosts(page = 0, size = 20): Promise<PostListResponse> {
  return fetchWithAuth<PostListResponse>(`${API_URL}/api/posts/me?page=${page}&size=${size}`);
}

/**
 * 게시글 상세 조회
 * GET /api/posts/{postId}
 */
export async function getPost(postId: number): Promise<Post> {
  return fetchWithAuth<Post>(`${API_URL}/api/posts/${postId}`);
}

/**
 * 게시글 작성
 * POST /api/posts
 */
export async function createPost(request: PostCreateRequest): Promise<Post> {
  return fetchWithAuth<Post>(`${API_URL}/api/posts`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * 게시글 수정
 * POST /api/posts/{postId}/update
 */
export async function updatePost(postId: number, request: PostUpdateRequest): Promise<Post> {
  return fetchWithAuth<Post>(`${API_URL}/api/posts/${postId}/update`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * 게시글 삭제
 * POST /api/posts/{postId}/delete
 */
export async function deletePost(postId: number): Promise<{ message: string }> {
  return fetchWithAuth<{ message: string }>(`${API_URL}/api/posts/${postId}/delete`, {
    method: 'POST',
  });
}

/**
 * 게시글 상태 변경
 * POST /api/posts/{postId}/status
 */
export async function updatePostStatus(
  postId: number,
  request: PostStatusUpdateRequest
): Promise<Post> {
  return fetchWithAuth<Post>(`${API_URL}/api/posts/${postId}/status`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * 게시글 끌어올리기
 * POST /api/posts/{postId}/bump
 */
export async function bumpPost(postId: number): Promise<Post> {
  return fetchWithAuth<Post>(`${API_URL}/api/posts/${postId}/bump`, {
    method: 'POST',
  });
}

// ========== 가격 제안 API 함수 ==========

/**
 * 가격 제안 생성
 * POST /api/posts/{postId}/price-offer
 */
export async function createPriceOffer(
  postId: number,
  request: PriceOfferCreateRequest
): Promise<PriceOfferResponse> {
  return fetchWithAuth<PriceOfferResponse>(`${API_URL}/api/posts/${postId}/price-offer`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * 가격 제안 수락
 * POST /api/price-offers/{offerId}/accept
 */
export async function acceptPriceOffer(offerId: number): Promise<PriceOfferAcceptResponse> {
  return fetchWithAuth<PriceOfferAcceptResponse>(`${API_URL}/api/price-offers/${offerId}/accept`, {
    method: 'POST',
  });
}

/**
 * 가격 제안 거절
 * POST /api/price-offers/{offerId}/reject
 */
export async function rejectPriceOffer(offerId: number): Promise<PriceOfferResponse> {
  return fetchWithAuth<PriceOfferResponse>(`${API_URL}/api/price-offers/${offerId}/reject`, {
    method: 'POST',
  });
}

/**
 * 내가 받은 가격 제안 목록 조회
 * GET /api/price-offers/received
 */
export async function getReceivedPriceOffers(
  page = 0,
  size = 20
): Promise<{ offers: PriceOfferResponse[]; totalElements: number; hasNext: boolean }> {
  return fetchWithAuth(`${API_URL}/api/price-offers/received?page=${page}&size=${size}`);
}

/**
 * 내가 보낸 가격 제안 목록 조회
 * GET /api/price-offers/sent
 */
export async function getSentPriceOffers(
  page = 0,
  size = 20
): Promise<{ offers: PriceOfferResponse[]; totalElements: number; hasNext: boolean }> {
  return fetchWithAuth(`${API_URL}/api/price-offers/sent?page=${page}&size=${size}`);
}

// ========== 리뷰 API 함수 ==========

/**
 * 리뷰 작성
 * POST /api/reviews
 */
export async function createReview(request: ReviewCreateRequest): Promise<ReviewResponse> {
  return fetchWithAuth<ReviewResponse>(`${API_URL}/api/reviews`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * 특정 사용자의 리뷰 목록 조회
 * GET /api/users/{userId}/reviews
 */
export async function getUserReviews(
  userId: number,
  page = 0,
  size = 20
): Promise<ReviewListResponse> {
  return fetchWithAuth<ReviewListResponse>(
    `${API_URL}/api/users/${userId}/reviews?page=${page}&size=${size}`
  );
}

/**
 * 리뷰 작성 가능 여부 확인
 * GET /api/posts/{postId}/can-review
 */
export async function canWriteReview(postId: number): Promise<{ canReview: boolean; reason?: string }> {
  return fetchWithAuth<{ canReview: boolean; reason?: string }>(
    `${API_URL}/api/posts/${postId}/can-review`
  );
}

// ========== 신고 API 함수 ==========

/**
 * 게시글 신고
 * POST /api/reports
 */
export async function createReport(request: ReportCreateRequest): Promise<ReportResponse> {
  return fetchWithAuth<ReportResponse>(`${API_URL}/api/reports`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

// ========== 좋아요 API 함수 ==========

/**
 * 게시글 좋아요
 * POST /api/posts/{postId}/like
 */
export async function likePost(postId: number): Promise<{ liked: boolean; likeCount: number }> {
  return fetchWithAuth<{ liked: boolean; likeCount: number }>(`${API_URL}/api/posts/${postId}/like`, {
    method: 'POST',
  });
}

/**
 * 게시글 좋아요 해제
 * POST /api/posts/{postId}/unlike
 */
export async function unlikePost(postId: number): Promise<{ liked: boolean; likeCount: number }> {
  return fetchWithAuth<{ liked: boolean; likeCount: number }>(`${API_URL}/api/posts/${postId}/unlike`, {
    method: 'POST',
  });
}

/**
 * 게시글 좋아요 토글 (클라이언트에서 상태에 따라 like/unlike 호출)
 */
export async function togglePostLike(postId: number, currentlyLiked: boolean): Promise<{ liked: boolean; likeCount: number }> {
  if (currentlyLiked) {
    return unlikePost(postId);
  } else {
    return likePost(postId);
  }
}

/**
 * 내 좋아요 목록 조회
 * GET /api/likes
 */
export async function getMyLikes(page = 0, size = 20): Promise<PostListResponse> {
  return fetchWithAuth<PostListResponse>(`${API_URL}/api/likes?page=${page}&size=${size}`);
}

/**
 * 내가 좋아요한 게시글 목록 조회 (기존 호환용)
 * GET /api/posts/liked
 */
export async function getLikedPosts(page = 0, size = 20): Promise<PostListResponse> {
  return fetchWithAuth<PostListResponse>(`${API_URL}/api/posts/liked?page=${page}&size=${size}`);
}

// ========== 유틸리티 함수 ==========

/**
 * 가격 포맷팅 (숫자 → 문자열)
 */
export function formatPrice(price: number | null, currencyType: string | null): string {
  if (price === null || price === 0) return '나눔';

  const formattedPrice = price.toLocaleString('ko-KR');

  switch (currencyType) {
    case 'BELL':
      return `${formattedPrice}벨`;
    case 'MILE_TICKET':
      return `${formattedPrice}마일`;
    default:
      return `${formattedPrice}원`;
  }
}

/**
 * 상대 시간 포맷팅
 */
export function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return '';

  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (seconds < 60) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  if (days < 365) return `${Math.floor(days / 30)}개월 전`;

  return `${Math.floor(days / 365)}년 전`;
}

/**
 * 게시글 상태 한글 변환
 */
export function getStatusLabel(status: string): string {
  switch (status) {
    case 'AVAILABLE':
      return '판매중';
    case 'RESERVED':
      return '예약중';
    case 'COMPLETED':
      return '거래완료';
    default:
      return status;
  }
}

// ========== 채팅 API 함수 ==========

/**
 * 채팅방 목록 조회
 * GET /api/chat/rooms
 */
export async function getChatRooms(page = 0, size = 20): Promise<ChatRoomListResponse> {
  return fetchWithAuth<ChatRoomListResponse>(`${API_URL}/api/chat/rooms?page=${page}&size=${size}`);
}

/**
 * 채팅방 생성 또는 조회
 * POST /api/chat/rooms
 */
export async function createOrGetChatRoom(request: ChatRoomCreateRequest): Promise<ChatRoom> {
  return fetchWithAuth<ChatRoom>(`${API_URL}/api/chat/rooms`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * 채팅방 상세 조회
 * GET /api/chat/rooms/{roomId}
 */
export async function getChatRoom(roomId: number): Promise<ChatRoom> {
  return fetchWithAuth<ChatRoom>(`${API_URL}/api/chat/rooms/${roomId}`);
}

/**
 * 채팅 메시지 목록 조회
 * GET /api/chat/rooms/{roomId}/messages
 */
export async function getChatMessages(
  roomId: number,
  page = 0,
  size = 50
): Promise<ChatMessageListResponse> {
  return fetchWithAuth<ChatMessageListResponse>(
    `${API_URL}/api/chat/rooms/${roomId}/messages?page=${page}&size=${size}`
  );
}

/**
 * 채팅방 나가기
 * POST /api/chat/rooms/{roomId}/leave
 */
export async function leaveChatRoom(roomId: number): Promise<{ message: string }> {
  return fetchWithAuth<{ message: string }>(`${API_URL}/api/chat/rooms/${roomId}/leave`, {
    method: 'POST',
  });
}

/**
 * 거래 예약하기
 * POST /api/chat/rooms/{roomId}/reserve
 */
export async function reserveChatRoom(roomId: number): Promise<ChatRoom> {
  return fetchWithAuth<ChatRoom>(`${API_URL}/api/chat/rooms/${roomId}/reserve`, {
    method: 'POST',
  });
}

/**
 * 거래 예약 취소
 * POST /api/chat/rooms/{roomId}/unreserve
 */
export async function unreserveChatRoom(roomId: number): Promise<ChatRoom> {
  return fetchWithAuth<ChatRoom>(`${API_URL}/api/chat/rooms/${roomId}/unreserve`, {
    method: 'POST',
  });
}

/**
 * 거래 완료
 * POST /api/chat/rooms/{roomId}/complete
 */
export async function completeChatRoom(roomId: number): Promise<ChatRoom> {
  return fetchWithAuth<ChatRoom>(`${API_URL}/api/chat/rooms/${roomId}/complete`, {
    method: 'POST',
  });
}

// ========== 차단 API 함수 ==========

/**
 * 차단 목록 조회
 * GET /api/blocks
 */
export async function getBlockedUsers(page = 0, size = 20): Promise<BlockListResponse> {
  return fetchWithAuth<BlockListResponse>(`${API_URL}/api/blocks?page=${page}&size=${size}`);
}

/**
 * 사용자 차단
 * POST /api/blocks
 */
export async function blockUser(blockedUserId: string): Promise<BlockedUser> {
  return fetchWithAuth<BlockedUser>(`${API_URL}/api/blocks`, {
    method: 'POST',
    body: JSON.stringify({ blockedUserId }),
  });
}

/**
 * 사용자 차단 해제
 * DELETE /api/blocks/{blockedUserId}
 */
export async function unblockUser(blockedUserId: string): Promise<{ message: string }> {
  return fetchWithAuth<{ message: string }>(`${API_URL}/api/blocks/${blockedUserId}`, {
    method: 'DELETE',
  });
}
