"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createChatRoom } from "@/lib/chatApi";

// 로딩 스피너
function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#7ECEC5] border-t-transparent rounded-full animate-spin" />
      <p className="mt-3 text-gray-500 text-sm">채팅방 연결 중...</p>
    </div>
  );
}

// 채팅방 생성 후 리다이렉트하는 컴포넌트
function NewChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const postId = searchParams.get("postId");
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (!postId) {
      router.push("/");
      return;
    }

    // Before: Number("abc") → NaN이 createChatRoom에 그대로 전달
    // After: 숫자 검증 후 유효하지 않으면 홈으로 리다이렉트
    const numericPostId = Number(postId);
    if (Number.isNaN(numericPostId) || numericPostId <= 0) {
      router.push("/");
      return;
    }

    const initChatRoom = async () => {
      try {
        // 채팅방 생성 (이미 존재하면 기존 채팅방 반환)
        const room = await createChatRoom(numericPostId);
        // 생성된 채팅방으로 리다이렉트 (히스토리 교체로 뒤로가기 시 이 페이지 건너뜀)
        router.replace(`/chat/${room.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "채팅방을 생성하는데 실패했습니다");
      }
    };

    initChatRoom();
  }, [isAuthenticated, authLoading, postId, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-primary text-white rounded-lg"
        >
          뒤로 가기
        </button>
      </div>
    );
  }

  return <LoadingSpinner />;
}

// Next.js SSG에서 useSearchParams는 Suspense boundary 필요
export default function NewChatPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <NewChatContent />
    </Suspense>
  );
}
