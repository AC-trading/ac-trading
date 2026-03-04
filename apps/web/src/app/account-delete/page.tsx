import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "계정 삭제 요청 - 거동숲",
  description: "거동숲 계정 및 데이터 삭제 요청 안내",
};

const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@ac-trading.com";

// Google Play Store 정책 준수용 계정 삭제 요청 페이지
export default function AccountDeletePage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF" }}>
      {/* 헤더 */}
      <header
        className="sticky top-0 border-b border-gray-200 px-4 py-3"
        style={{ backgroundColor: "#FFFFFF" }}
      >
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            ← 돌아가기
          </Link>
          <h1 className="text-lg font-semibold">계정 삭제 요청</h1>
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
              계정 삭제 요청 방법
            </h2>

            {/* 방법 1: 앱 내 */}
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
                  "[설정] 아이콘을 탭합니다.",
                  "[회원 탈퇴] 버튼을 누르고 안내에 따라 진행합니다.",
                  "탈퇴가 완료되면 계정과 관련 데이터가 즉시 삭제 처리됩니다.",
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
              탈퇴 요청 처리 시 다음 데이터가 <strong>즉시 삭제</strong>됩니다.
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
          <span className="font-medium text-gray-700">계정 삭제 요청</span>
        </div>
      </footer>
    </div>
  );
}
