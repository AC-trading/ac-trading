// 최근 본 거래글 관리 유틸리티
// localStorage를 사용하여 클라이언트에서 관리

const STORAGE_KEY = 'recent_viewed_posts';
const MAX_ITEMS = 20;

export interface RecentViewedPost {
  postId: number;
  viewedAt: string;
}

/**
 * 최근 본 거래글 목록 조회
 */
export function getRecentViewedPosts(): RecentViewedPost[] {
  if (typeof window === 'undefined') return [];

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * 최근 본 거래글 ID 목록만 조회
 */
export function getRecentViewedPostIds(): number[] {
  return getRecentViewedPosts().map(p => p.postId);
}

/**
 * 최근 본 거래글 추가
 * - 중복 제거 후 맨 앞에 추가
 * - 최대 20개 유지
 */
export function addRecentViewedPost(postId: number): void {
  if (typeof window === 'undefined') return;

  try {
    const posts = getRecentViewedPosts()
      .filter(p => p.postId !== postId); // 중복 제거

    posts.unshift({
      postId,
      viewedAt: new Date().toISOString(),
    });

    // 최대 개수 유지
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts.slice(0, MAX_ITEMS)));
  } catch {
    // localStorage 에러 무시
  }
}

/**
 * 최근 본 거래글 목록 초기화
 */
export function clearRecentViewedPosts(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage 에러 무시
  }
}

/**
 * 특정 거래글 제거 (삭제된 게시글 처리용)
 */
export function removeRecentViewedPost(postId: number): void {
  if (typeof window === 'undefined') return;

  try {
    const posts = getRecentViewedPosts().filter(p => p.postId !== postId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  } catch {
    // localStorage 에러 무시
  }
}
