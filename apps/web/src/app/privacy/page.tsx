import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "개인정보처리방침 - 거동숲",
  description: "거동숲 개인정보처리방침",
};

// 개인정보처리방침 페이지
export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            ← 돌아가기
          </Link>
          <h1 className="text-lg font-semibold">개인정보처리방침</h1>
        </div>
      </header>

      {/* 본문 */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="prose prose-sm max-w-none text-gray-700">
          <p className="text-sm text-gray-500 mb-6">
            시행일: 2025년 2월 1일
          </p>

          <p className="mb-6">
            거동숲(이하 &quot;서비스&quot;)은 이용자의 개인정보를 중요하게 생각하며,
            개인정보보호법 등 관련 법령을 준수합니다. 본 개인정보처리방침을 통해
            이용자의 개인정보가 어떻게 수집, 이용, 보관, 파기되는지 안내드립니다.
          </p>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. 수집하는 개인정보 항목</h2>
            <p className="mb-2">서비스는 다음과 같은 개인정보를 수집합니다.</p>

            <h3 className="font-medium text-gray-800 mt-4 mb-2">가. 소셜 로그인 시 수집 정보</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Google 로그인: 이메일 주소, 이름, 프로필 사진</li>
              <li>Kakao 로그인: 이메일 주소, 닉네임, 프로필 사진</li>
            </ul>

            <h3 className="font-medium text-gray-800 mt-4 mb-2">나. 서비스 이용 시 수집 정보</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>프로필 정보: 닉네임, 섬 이름, 프로필 이미지</li>
              <li>거래 정보: 거래글 내용, 이미지, 거래 내역</li>
              <li>채팅 기록: 이용자 간 채팅 메시지</li>
              <li>자동 수집 정보: 접속 IP, 접속 시간, 기기 정보</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. 개인정보 수집 목적</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>회원 가입 및 관리: 회원 식별, 본인 확인</li>
              <li>서비스 제공: 거래글 등록, 채팅, 알림 기능 제공</li>
              <li>서비스 개선: 이용 통계 분석, 서비스 품질 향상</li>
              <li>분쟁 해결: 거래 관련 분쟁 조정 및 민원 처리</li>
              <li>부정 이용 방지: 약관 위반 행위 모니터링</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. 개인정보 보유 및 이용 기간</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>회원 탈퇴 시까지 보유 후 즉시 파기</li>
              <li>단, 관련 법령에 따라 보존이 필요한 경우:
                <ul className="list-circle pl-5 mt-1 space-y-1">
                  <li>전자상거래법에 따른 표시/광고 기록: 6개월</li>
                  <li>계약 또는 청약철회 기록: 5년</li>
                  <li>소비자 불만 또는 분쟁처리 기록: 3년</li>
                </ul>
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. 개인정보의 제3자 제공</h2>
            <p>
              서비스는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.
              다만, 다음의 경우에는 예외로 합니다.
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>이용자가 사전에 동의한 경우</li>
              <li>법령에 의거하거나, 수사기관의 요청이 있는 경우</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. 개인정보의 파기</h2>
            <p>
              이용 목적이 달성된 개인정보는 지체 없이 파기합니다.
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>전자적 파일: 복구 불가능한 방법으로 영구 삭제</li>
              <li>종이 문서: 분쇄기로 파쇄 또는 소각</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. 이용자의 권리</h2>
            <p>이용자는 언제든지 다음의 권리를 행사할 수 있습니다.</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>개인정보 열람 요청</li>
              <li>개인정보 정정 요청</li>
              <li>개인정보 삭제 요청</li>
              <li>개인정보 처리 정지 요청</li>
            </ul>
            <p className="mt-2">
              위 권리 행사는 서비스 내 설정 메뉴 또는 아래 문의처를 통해 요청할 수 있습니다.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. 개인정보의 안전성 확보 조치</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>개인정보 암호화: 비밀번호 등 중요 정보는 암호화하여 저장</li>
              <li>접근 권한 관리: 개인정보 처리 담당자를 최소한으로 제한</li>
              <li>보안 프로그램 운영: 해킹 등 외부 침입 방지</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. 문의처</h2>
            <p>
              개인정보 관련 문의사항이 있으시면 아래로 연락 주시기 바랍니다.
            </p>
            <ul className="list-none pl-0 mt-2 space-y-1">
              <li>이메일: support@ac-trading.com</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">9. 개인정보처리방침 변경</h2>
            <p>
              본 개인정보처리방침은 법령, 정책 또는 서비스 변경에 따라
              수정될 수 있으며, 변경 시 서비스 내 공지사항을 통해 안내드립니다.
            </p>
          </section>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="border-t border-gray-200 py-6 mt-8">
        <div className="max-w-3xl mx-auto px-4 text-center text-sm text-gray-500">
          <Link href="/terms" className="hover:underline">
            이용약관
          </Link>
          <span className="mx-2">|</span>
          <span className="font-medium text-gray-700">개인정보처리방침</span>
        </div>
      </footer>
    </div>
  );
}
