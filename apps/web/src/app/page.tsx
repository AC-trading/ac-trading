"use client";

import Link from "next/link";
import { MobileLayout, Header } from "@/components/common";
import { HeartIcon, CommentIcon, PlusIcon } from "@/components/icons";

// 더미 거래글 데이터
const mockPosts = [
  {
    id: 1,
    title: "에어팟 프로",
    location: "군자동",
    time: "3일 전",
    price: 220000,
    image: "/images/airpods.jpg",
    comments: 3,
    likes: 11,
  },
  {
    id: 2,
    title: "바이레도 블랑쉬 50ml",
    location: "광진구 구의제3동",
    time: "26초 전",
    price: 4000,
    image: "/images/perfume.jpg",
    comments: 0,
    likes: 2,
  },
  {
    id: 3,
    title: "샌드위치",
    location: "동대문구 휘경동",
    time: "끌올 59초 전",
    price: 8000,
    image: "/images/sandwich.jpg",
    comments: 0,
    likes: 0,
  },
  {
    id: 4,
    title: "아이폰 13프로맥스",
    location: "군자동",
    time: "1일 전",
    price: 1000000,
    image: "/images/iphone.jpg",
    comments: 0,
    likes: 0,
  },
  {
    id: 5,
    title: "커피머신",
    location: "구리시 교문1동",
    time: "1초 전",
    price: 100000,
    image: "/images/coffee.jpg",
    comments: 0,
    likes: 0,
  },
];

// 가격 포맷팅 함수
function formatPrice(price: number): string {
  return price.toLocaleString("ko-KR") + "원";
}

// 거래글 아이템 컴포넌트
function PostItem({ post }: { post: (typeof mockPosts)[0] }) {
  return (
    <Link
      href={`/post/${post.id}`}
      className="flex gap-4 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
    >
      {/* 상품 이미지 */}
      <div className="w-28 h-28 bg-gray-200 rounded-xl overflow-hidden flex-shrink-0">
        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-400">
          📦
        </div>
      </div>

      {/* 상품 정보 */}
      <div className="flex-1 flex flex-col justify-between py-1">
        <div>
          <h3 className="font-medium text-gray-900 line-clamp-2">{post.title}</h3>
          <p className="text-xs text-gray-500 mt-1">
            {post.location} · {post.time}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <p className="font-bold text-primary">{formatPrice(post.price)}</p>
          <div className="flex items-center gap-3 text-gray-400">
            {post.comments > 0 && (
              <span className="flex items-center gap-1">
                <CommentIcon />
                <span className="text-xs">{post.comments}</span>
              </span>
            )}
            {post.likes > 0 && (
              <span className="flex items-center gap-1">
                <HeartIcon />
                <span className="text-xs">{post.likes}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// 홈 페이지 (거래글 목록) - Figma 디자인 기반
export default function HomePage() {
  return (
    <MobileLayout>
      <Header showLocation showSearch showMenu showBell />

      {/* 거래글 목록 */}
      <div className="divide-y divide-gray-100">
        {mockPosts.map((post) => (
          <PostItem key={post.id} post={post} />
        ))}
      </div>

      {/* 글쓰기 FAB 버튼 */}
      <Link
        href="/post/new"
        className="fixed bottom-24 right-4 w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary-dark transition-colors z-40"
        style={{ right: "calc(50% - 195px + 16px)" }}
      >
        <PlusIcon className="text-white" />
      </Link>
    </MobileLayout>
  );
}
