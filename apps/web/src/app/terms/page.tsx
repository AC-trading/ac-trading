import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "이용약관 - 거동숲",
  description: "거동숲 서비스 이용약관",
};

// 이용약관 페이지
export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            ← 돌아가기
          </Link>
          <h1 className="text-lg font-semibold">이용약관</h1>
        </div>
      </header>

      {/* 본문 */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="prose prose-sm max-w-none text-gray-700">
          <p className="text-sm text-gray-500 mb-6">
            시행일: 2025년 2월 1일
          </p>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제1조 (목적)</h2>
            <p>
              본 약관은 거동숲(이하 &quot;서비스&quot;)이 제공하는 모여봐요 동물의 숲
              게임 내 아이템 거래 중개 플랫폼의 이용과 관련하여 서비스와
              이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제2조 (정의)</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>&quot;서비스&quot;란 이용자 간 게임 내 아이템 거래 정보를 교환할 수 있도록 제공하는 온라인 플랫폼을 말합니다.</li>
              <li>&quot;이용자&quot;란 본 약관에 동의하고 서비스를 이용하는 자를 말합니다.</li>
              <li>&quot;거래글&quot;이란 이용자가 거래를 목적으로 서비스에 등록하는 게시물을 말합니다.</li>
              <li>&quot;아이템&quot;이란 모여봐요 동물의 숲 게임 내에서 거래 가능한 가상의 물품을 말합니다.</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제3조 (약관의 효력 및 변경)</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>본 약관은 서비스 내에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.</li>
              <li>서비스는 필요한 경우 관련 법령을 위배하지 않는 범위에서 약관을 변경할 수 있습니다.</li>
              <li>변경된 약관은 공지 후 7일이 경과한 시점부터 효력이 발생합니다.</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제4조 (회원가입 및 탈퇴)</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>이용자는 소셜 로그인(Google, Kakao)을 통해 회원가입할 수 있습니다.</li>
              <li>회원은 언제든지 서비스 내 설정에서 탈퇴를 요청할 수 있습니다.</li>
              <li>탈퇴 시 회원의 개인정보는 개인정보처리방침에 따라 처리됩니다.</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제5조 (서비스의 제공)</h2>
            <p>서비스는 다음과 같은 기능을 제공합니다.</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>거래글 등록, 수정, 삭제</li>
              <li>거래글 검색 및 조회</li>
              <li>이용자 간 채팅</li>
              <li>관심 목록 및 알림</li>
              <li>거래 후기 및 매너 평가</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제6조 (이용자의 의무)</h2>
            <p>이용자는 다음 행위를 하여서는 안 됩니다.</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>타인의 개인정보를 도용하거나 부정하게 사용하는 행위</li>
              <li>서비스 운영을 고의로 방해하는 행위</li>
              <li>욕설, 비방, 음란물 등 불건전한 내용을 게시하는 행위</li>
              <li>실제 금전 거래(현금, 계좌이체 등)를 유도하는 행위</li>
              <li>허위 거래글을 등록하는 행위</li>
              <li>게임 이용약관을 위반하는 아이템(불법 복제 등)을 거래하는 행위</li>
              <li>기타 법령 또는 본 약관에 위배되는 행위</li>
            </ul>
          </section>

          <section className="mb-8 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제7조 (면책조항) ⚠️</h2>
            <ol className="list-decimal pl-5 space-y-3">
              <li>
                <strong>거래 당사자 간 책임:</strong> 서비스는 이용자 간 거래를 중개하는
                플랫폼으로서, 거래 당사자 간에 발생하는 분쟁(사기, 불이행, 아이템 하자 등)에
                대해 책임을 지지 않습니다.
              </li>
              <li>
                <strong>게임 내 아이템 거래:</strong> 본 서비스는 &quot;모여봐요 동물의 숲&quot;
                게임 내 가상 아이템의 거래 정보를 교환하는 플랫폼입니다. 실물 거래가 아닌
                게임 내 거래이며, 닌텐도의 게임 이용약관을 준수해야 합니다.
              </li>
              <li>
                <strong>거래 보증 불가:</strong> 서비스는 거래의 완료, 아이템의 품질,
                거래 상대방의 신뢰성을 보증하지 않습니다.
              </li>
              <li>
                <strong>서비스 중단:</strong> 천재지변, 시스템 장애 등 불가항력적인 사유로
                서비스 제공이 중단되는 경우 책임을 지지 않습니다.
              </li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제8조 (서비스 이용 제한)</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>서비스는 이용자가 본 약관을 위반한 경우 서비스 이용을 제한하거나 회원 자격을 정지할 수 있습니다.</li>
              <li>이용 제한 시 사전 통지를 원칙으로 하나, 긴급한 경우 사후 통지할 수 있습니다.</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제9조 (게시물의 관리)</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>이용자가 등록한 게시물의 저작권은 해당 이용자에게 귀속됩니다.</li>
              <li>서비스는 다음에 해당하는 게시물을 사전 통지 없이 삭제할 수 있습니다.
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>본 약관에 위배되는 내용</li>
                  <li>타인의 권리를 침해하는 내용</li>
                  <li>불법적이거나 음란한 내용</li>
                </ul>
              </li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제10조 (분쟁 해결)</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>서비스와 이용자 간 분쟁은 상호 협의하여 해결합니다.</li>
              <li>협의가 이루어지지 않을 경우, 대한민국 법령에 따릅니다.</li>
              <li>서비스 이용과 관련된 소송의 관할법원은 민사소송법에 따릅니다.</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제11조 (문의)</h2>
            <p>
              서비스 이용에 관한 문의사항은 아래로 연락 주시기 바랍니다.
            </p>
            <ul className="list-none pl-0 mt-2 space-y-1">
              <li>이메일: support@ac-trading.com</li>
            </ul>
          </section>

          <section className="mt-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>부칙</strong><br />
              본 약관은 2025년 2월 1일부터 시행됩니다.
            </p>
          </section>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="border-t border-gray-200 py-6 mt-8">
        <div className="max-w-3xl mx-auto px-4 text-center text-sm text-gray-500">
          <span className="font-medium text-gray-700">이용약관</span>
          <span className="mx-2">|</span>
          <Link href="/privacy" className="hover:underline">
            개인정보처리방침
          </Link>
        </div>
      </footer>
    </div>
  );
}
