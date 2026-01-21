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
