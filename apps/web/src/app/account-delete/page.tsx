"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

if (!process.env.NEXT_PUBLIC_API_URL) throw new Error('NEXT_PUBLIC_API_URL 환경 변수가 설정되지 않았습니다.');
const API_URL = process.env.NEXT_PUBLIC_API_URL;

const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "seulhuioh0710@gmail.com";

// Google Play Store 정책 준수용 계정 삭제 페이지
export default function AccountDeletePage() {
  const router = useRouter();
  const { accessToken, logout } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!accessToken) {
      router.push("/login");
      return;
    }
    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/users/me/delete`, {
        method: "POST",
        credentials: "include",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        await logout();
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.message || "계정 삭제에 실패했습니다. 다시 시도해주세요.");
        setShowConfirm(false);
      }
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
      setShowConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF" }}>
      {/* 헤더 */}
      <header
        className="sticky top-0 border-b border-gray-200 px-4 py-3"
        style={{ backgroundColor: "#FFFFFF" }}
      >
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/settings" className="text-gray-600 hover:text-gray-900">
            ← 돌아가기
          </Link>
          <h1 className="text-lg font-semibold">계정 삭제</h1>
        </div>
      </header>

      {/* 본문 */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* 앱 식별 */}
        <div className="mb-8 p-4 rounded-xl border border-gray-100 bg-gray-50">
          <p className="text-sm text-gray-500">서비스명</p>
          <p className="text-xl font-bold text-gray-900 mt-1">거동숲</p>
          <p className="text-sm text-gray-500 mt-1">
            모여봐요 동물의 숲 아이템 거래 플랫폼
          </p>
        </div>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-8">
          {/* 계정 삭제 방법 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              계정 삭제 방법
            </h2>

            {/* 방법 1: 앱/웹 내 */}
            <div className="mb-6">
              <div
                className="inline-block text-xs font-semibold px-2 py-1 rounded mb-3"
                style={{ backgroundColor: "#7ECEC5", color: "#FFFFFF" }}
              >
                방법 1 — 앱/웹 내에서 직접 탈퇴
              </div>
              <ol className="list-none space-y-3 pl-0">
                {[
                  "앱 또는 웹에서 로그인합니다.",
                  "하단 탭의 [프로필] 메뉴로 이동합니다.",
                  "우측 상단 설정 아이콘을 탭합니다.",
                  "[탈퇴하기]를 누릅니다.",
                  "이 페이지 하단의 [탈퇴하기] 버튼을 누르고 확인합니다.",
                  "탈퇴가 완료되면 법령 보관 대상을 제외한 계정 및 관련 데이터가 즉시 삭제됩니다.",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      className="flex-shrink-0 w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center"
                      style={{ backgroundColor: "#7ECEC5" }}
                    >
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* 방법 2: 이메일 */}
            <div>
              <div
                className="inline-block text-xs font-semibold px-2 py-1 rounded mb-3"
                style={{ backgroundColor: "#adb5bd", color: "#FFFFFF" }}
              >
                방법 2 — 이메일로 요청
              </div>
              <p className="mb-2">
                앱/웹 접근이 어려운 경우 아래 이메일로 계정 삭제를 요청할 수
                있습니다.
              </p>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="font-medium underline"
                style={{ color: "#5BBFB3" }}
              >
                {SUPPORT_EMAIL}
              </a>
              <p className="mt-2 text-sm text-gray-500">
                이메일 제목: [계정 삭제 요청] 가입 이메일 주소 기재
                <br />
                처리 기간: 영업일 기준 3일 이내
              </p>
            </div>
          </section>

          {/* 삭제되는 데이터 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              삭제되는 데이터
            </h2>
            <p className="mb-3">
              계정 삭제 시 다음 데이터가 <strong>즉시 삭제</strong>됩니다.
              단, 법령에 따라 보관이 필요한 데이터는 아래 표를 확인해주세요.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>계정 정보 (이메일, 닉네임, 프로필 이미지, 섬 이름)</li>
              <li>작성한 거래글 및 첨부 이미지</li>
              <li>채팅 내역</li>
              <li>받은 후기 및 매너 점수</li>
              <li>관심 목록 및 키워드 알림 설정</li>
              <li>자동 수집 정보 (접속 IP, 접속 시간 등)</li>
            </ul>
          </section>

          {/* 보관되는 데이터 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              법령에 따라 보관되는 데이터
            </h2>
            <p className="mb-3">
              관련 법령에 의해 아래 데이터는 일정 기간 보관 후 파기됩니다.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 pr-4 font-semibold text-gray-800">
                      데이터 유형
                    </th>
                    <th className="text-left py-2 pr-4 font-semibold text-gray-800">
                      보관 기간
                    </th>
                    <th className="text-left py-2 font-semibold text-gray-800">
                      근거 법령
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-2 pr-4">표시·광고 기록</td>
                    <td className="py-2 pr-4">6개월</td>
                    <td className="py-2 text-gray-500">전자상거래법</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">계약·청약철회 기록</td>
                    <td className="py-2 pr-4">5년</td>
                    <td className="py-2 text-gray-500">전자상거래법</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">소비자 불만·분쟁처리 기록</td>
                    <td className="py-2 pr-4">3년</td>
                    <td className="py-2 text-gray-500">전자상거래법</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm text-gray-500">
              보관 기간이 경과한 데이터는 복구 불가능한 방법으로 즉시 파기됩니다.
            </p>
          </section>

          {/* 문의 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">문의</h2>
            <p>
              계정 삭제 관련 추가 문의는{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="underline"
                style={{ color: "#5BBFB3" }}
              >
                {SUPPORT_EMAIL}
              </a>
              으로 연락 주시기 바랍니다.
            </p>
          </section>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mt-6 p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* 탈퇴하기 버튼 */}
        <div className="mt-10 mb-4">
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full py-3 rounded-lg border border-red-300 text-red-500 font-semibold hover:bg-red-50 transition-colors"
          >
            탈퇴하기
          </button>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="border-t border-gray-200 py-6 mt-8">
        <div className="max-w-3xl mx-auto px-4 text-center text-sm text-gray-500">
          <Link href="/terms" className="hover:underline">
            이용약관
          </Link>
          <span className="mx-2">|</span>
          <Link href="/privacy" className="hover:underline">
            개인정보처리방침
          </Link>
          <span className="mx-2">|</span>
          <span className="font-medium text-gray-700">계정 삭제</span>
        </div>
      </footer>

      {/* 탈퇴 확인 모달 */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl mx-6 w-full max-w-sm overflow-hidden">
            <div className="px-6 py-6 text-center">
              <p className="text-base font-semibold text-gray-900">정말 탈퇴하시겠습니까?</p>
              <p className="mt-2 text-sm text-gray-500">
                계정 및 모든 데이터가 삭제되며 복구할 수 없습니다.
              </p>
            </div>
            <div className="flex border-t border-gray-100">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isDeleting}
                className="flex-1 py-4 text-sm text-gray-500 hover:bg-gray-50 transition-colors border-r border-gray-100 disabled:opacity-50"
              >
                아니오
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-4 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {isDeleting ? "처리 중..." : "예, 탈퇴합니다"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
