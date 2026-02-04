"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { MobileLayout, Header } from "@/components/common";
import { PlusIcon } from "@/components/icons";
import { useAuth } from "@/context/AuthContext";
import {
  getTransactions,
  getTransactionSummary,
  createTransaction,
  deleteTransaction,
  Transaction,
  TransactionSummary,
  TransactionCreateRequest,
  formatPrice,
  formatRelativeTime,
} from "@/lib/postApi";

// 기간 필터 타입
type PeriodFilter = "all" | "week" | "month" | "3months";

// 기간 필터 옵션
const periodFilters: { id: PeriodFilter; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "week", label: "1주일" },
  { id: "month", label: "1개월" },
  { id: "3months", label: "3개월" },
];

// 기간 필터에 따른 날짜 계산
function getDateRange(period: PeriodFilter): { startDate?: string; endDate?: string } {
  if (period === "all") return {};

  const now = new Date();
  const endDate = now.toISOString().split("T")[0];

  let startDate: Date;
  switch (period) {
    case "week":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      // CodeRabbit 리뷰 반영: 1일로 고정하여 월말 경계 오버플로우 방지
      // Before: new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
      // 예: 3월 31일 → 2월 31일 → 3월 3일로 오버플로우
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      break;
    case "3months":
      // CodeRabbit 리뷰 반영: 1일로 고정하여 월말 경계 오버플로우 방지
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      break;
    default:
      return {};
  }

  return {
    startDate: startDate.toISOString().split("T")[0],
    endDate,
  };
}

// 통계 카드 컴포넌트
function SummaryCard({ summary }: { summary: TransactionSummary }) {
  return (
    <div className="p-4 bg-gradient-to-r from-primary-light/30 to-primary/20 rounded-xl mx-4 mt-4">
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xs text-gray-500 mb-1">총 판매</p>
          <p className="font-bold text-primary">{summary.totalSales.toLocaleString()}</p>
          <p className="text-xs text-gray-400">{summary.salesCount}건</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">총 구매</p>
          <p className="font-bold text-red-500">{summary.totalPurchases.toLocaleString()}</p>
          <p className="text-xs text-gray-400">{summary.purchaseCount}건</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">순이익</p>
          <p className={`font-bold ${summary.netProfit >= 0 ? "text-primary" : "text-red-500"}`}>
            {summary.netProfit >= 0 ? "+" : ""}{summary.netProfit.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

// 거래 내역 아이템 컴포넌트
function TransactionItem({
  transaction,
  onDelete,
}: {
  transaction: Transaction;
  onDelete: (id: number) => void;
}) {
  const isSale = transaction.type === "SALE";

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-100">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            isSale
              ? "bg-primary/10 text-primary"
              : "bg-red-50 text-red-500"
          }`}>
            {isSale ? "판매" : "구매"}
          </span>
          <span className="font-medium text-gray-900">{transaction.postItemName || '삭제된 게시글'}</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-gray-400">
            {formatRelativeTime(transaction.tradedAt)}
          </p>
          {transaction.partnerNickname && (
            <p className="text-xs text-gray-400">
              · {transaction.partnerNickname}
            </p>
          )}
        </div>
        {transaction.memo && (
          <p className="text-xs text-gray-500 mt-1 truncate">{transaction.memo}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className={`font-bold ${isSale ? "text-primary" : "text-red-500"}`}>
          {isSale ? "+" : "-"}{formatPrice(transaction.amount, transaction.currencyType)}
        </span>
        <button
          onClick={() => onDelete(transaction.id)}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// 거래 추가 모달 컴포넌트
function AddTransactionModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionCreateRequest) => void;
  isSubmitting: boolean;
}) {
  const [type, setType] = useState<"SALE" | "PURCHASE">("SALE");
  const [currencyType, setCurrencyType] = useState<"BELL" | "MILE_TICKET">("BELL");
  const [itemName, setItemName] = useState("");
  const [amount, setAmount] = useState("");
  const [partnerNickname, setPartnerNickname] = useState("");
  const [memo, setMemo] = useState("");
  const [error, setError] = useState<string | null>(null);

  // CodeRabbit 리뷰 반영: 모달이 열릴 때 폼 상태 초기화
  useEffect(() => {
    if (isOpen) {
      setType("SALE");
      setCurrencyType("BELL");
      setItemName("");
      setAmount("");
      setPartnerNickname("");
      setMemo("");
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!itemName.trim()) {
      setError("아이템명을 입력해주세요");
      return;
    }

    const amountNum = parseInt(amount, 10);
    if (isNaN(amountNum) || amountNum < 0) {
      setError("올바른 금액을 입력해주세요");
      return;
    }

    onSubmit({
      type,
      currencyType,
      itemName: itemName.trim(),
      amount: amountNum,
      partnerNickname: partnerNickname.trim() || undefined,
      memo: memo.trim() || undefined,
    });
  };

  const resetForm = () => {
    setType("SALE");
    setCurrencyType("BELL");
    setItemName("");
    setAmount("");
    setPartnerNickname("");
    setMemo("");
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
      <div className="w-full bg-white rounded-t-2xl p-4 space-y-4 animate-slide-up max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">거래 기록 추가</h3>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <span className="text-xl">✕</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 거래 유형 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">거래 유형</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType("SALE")}
                className={`flex-1 py-2 rounded-lg text-sm border transition-colors ${
                  type === "SALE"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-gray-300 text-gray-700"
                }`}
              >
                판매
              </button>
              <button
                type="button"
                onClick={() => setType("PURCHASE")}
                className={`flex-1 py-2 rounded-lg text-sm border transition-colors ${
                  type === "PURCHASE"
                    ? "border-red-500 bg-red-50 text-red-500"
                    : "border-gray-300 text-gray-700"
                }`}
              >
                구매
              </button>
            </div>
          </div>

          {/* 아이템명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">아이템명</label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="거래한 아이템 이름"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>

          {/* 화폐 종류 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">화폐</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCurrencyType("BELL")}
                className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                  currencyType === "BELL"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-gray-300 text-gray-700"
                }`}
              >
                벨
              </button>
              <button
                type="button"
                onClick={() => setCurrencyType("MILE_TICKET")}
                className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                  currencyType === "MILE_TICKET"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-gray-300 text-gray-700"
                }`}
              >
                마일
              </button>
            </div>
          </div>

          {/* 금액 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">금액</label>
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                min="0"
                className="flex-1 px-4 py-3 focus:outline-none text-gray-900"
              />
              <span className="px-4 text-primary font-medium">
                {currencyType === "BELL" ? "벨" : "마일"}
              </span>
            </div>
          </div>

          {/* 거래 상대방 (선택) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              거래 상대방 <span className="text-gray-400">(선택)</span>
            </label>
            <input
              type="text"
              value={partnerNickname}
              onChange={(e) => setPartnerNickname(e.target.value)}
              placeholder="상대방 닉네임"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>

          {/* 메모 (선택) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              메모 <span className="text-gray-400">(선택)</span>
            </label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="간단한 메모"
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:border-primary"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:bg-gray-300"
          >
            {isSubmitting ? "저장 중..." : "저장하기"}
          </button>
        </form>
      </div>
    </div>
  );
}

// 가계부 페이지
export default function AccountBookPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 필터 상태
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");

  // 모달 상태
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 데이터 로드
  useEffect(() => {
    async function loadData() {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const dateRange = getDateRange(periodFilter);

        // 거래 내역과 통계를 병렬로 로드
        const [transactionsRes, summaryRes] = await Promise.all([
          getTransactions({ ...dateRange, page: 0, size: 50 }),
          getTransactionSummary(dateRange),
        ]);

        setTransactions(transactionsRes.transactions);
        setSummary(summaryRes);
      } catch (err) {
        console.error("데이터 로드 실패:", err);
        setError(err instanceof Error ? err.message : "데이터를 불러오는데 실패했습니다");
      } finally {
        setIsLoading(false);
      }
    }

    if (!authLoading) {
      loadData();
    }
  }, [isAuthenticated, authLoading, periodFilter]);

  // 거래 추가
  const handleAddTransaction = async (data: TransactionCreateRequest) => {
    try {
      setIsSubmitting(true);
      const created = await createTransaction(data);
      setTransactions((prev) => [created, ...prev]);

      // 통계 갱신
      const dateRange = getDateRange(periodFilter);
      const summaryRes = await getTransactionSummary(dateRange);
      setSummary(summaryRes);

      setShowAddModal(false);
    } catch (err) {
      console.error("거래 추가 실패:", err);
      alert(err instanceof Error ? err.message : "거래 추가에 실패했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 거래 삭제
  const handleDeleteTransaction = async (id: number) => {
    if (!confirm("이 거래 기록을 삭제하시겠습니까?")) return;

    try {
      await deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));

      // 통계 갱신
      const dateRange = getDateRange(periodFilter);
      const summaryRes = await getTransactionSummary(dateRange);
      setSummary(summaryRes);
    } catch (err) {
      console.error("거래 삭제 실패:", err);
      alert(err instanceof Error ? err.message : "거래 삭제에 실패했습니다");
    }
  };

  // 로그인 필요 여부
  const needsLogin = !authLoading && !isAuthenticated;

  return (
    <MobileLayout>
      {/* 헤더 */}
      <Header
        title="가계부"
        showBack
        onBack={() => window.history.back()}
      />

      {/* 로그인 필요 안내 */}
      {needsLogin && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <span className="text-6xl mb-4">🔒</span>
          <p>로그인이 필요해요</p>
          <Link
            href="/login"
            className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            로그인
          </Link>
        </div>
      )}

      {/* 로그인 상태일 때 */}
      {!needsLogin && (
        <>
          {/* 통계 카드 */}
          {summary && <SummaryCard summary={summary} />}

          {/* 기간 필터 */}
          <div className="flex gap-2 px-4 py-3 overflow-x-auto">
            {periodFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setPeriodFilter(filter.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  periodFilter === filter.id
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* 로딩 상태 */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            </div>
          )}

          {/* 에러 상태 */}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <p className="text-sm">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 text-sm text-primary hover:underline"
              >
                다시 시도
              </button>
            </div>
          )}

          {/* 빈 상태 */}
          {!isLoading && !error && transactions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <span className="text-6xl mb-4">📒</span>
              <p>거래 기록이 없어요</p>
              <p className="text-sm mt-1">아래 버튼을 눌러 거래를 기록해보세요</p>
            </div>
          )}

          {/* 거래 내역 목록 */}
          {!isLoading && !error && transactions.length > 0 && (
            <div>
              {transactions.map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  onDelete={handleDeleteTransaction}
                />
              ))}
            </div>
          )}

          {/* 거래 추가 FAB 버튼 */}
          <button
            onClick={() => setShowAddModal(true)}
            className="fixed bottom-24 right-4 w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary-dark transition-colors z-40"
          >
            <PlusIcon className="text-white" />
          </button>

          {/* 거래 추가 모달 */}
          <AddTransactionModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onSubmit={handleAddTransaction}
            isSubmitting={isSubmitting}
          />
        </>
      )}
    </MobileLayout>
  );
}
