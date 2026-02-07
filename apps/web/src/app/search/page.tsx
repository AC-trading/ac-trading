"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MobileLayout } from "@/components/common";
import { ChevronLeftIcon, SearchIcon, HeartIcon, CommentIcon } from "@/components/icons";

// 더미 검색 결과 데이터
const mockSearchResults = [
  {
    id: 1,
    title: "호화로운 침대",
    location: "군자동",
    time: "3일 전",
    price: 220000,
    comments: 3,
    likes: 11,
    category: "가구",
    currencyType: "벨",
    tradeType: "팔아요",
  },
  {
    id: 2,
    title: "별무늬 벽지",
    location: "광진구 구의제3동",
    time: "26초 전",
    price: 4000,
    comments: 0,
    likes: 2,
    category: "바닥/벽지",
    currencyType: "마일",
    tradeType: "팔아요",
  },
  {
    id: 3,
    title: "왕관 DIY 레시피",
    location: "군자동",
    time: "1일 전",
    price: 1000000,
    comments: 0,
    likes: 0,
    category: "DIY 레시피",
    currencyType: "벨",
    tradeType: "구해요",
  },
];

// 카테고리 목록
const categories = ["가구", "바닥/벽지", "옷", "재료", "DIY 레시피", "화석/미술품", "알바", "주민 사진/ 분양", "기타"];

// 화폐 유형 목록
const currencyTypes = ["벨", "마일"];

// 거래 유형 목록
const tradeTypes = ["팔아요", "구해요"];

// 가격 프리셋
const pricePresets = [
  { label: "2,000원 - 7,000원", min: 2000, max: 7000 },
  { label: "7,000원 - 1만 2,000원", min: 7000, max: 12000 },
  { label: "1만 2,000원 - 2만 3,000원", min: 12000, max: 23000 },
];

// 인기 검색어
const popularKeywords = [
  "닌텐도 스위치",
  "에어팟",
  "아이폰",
  "자전거",
  "DIY 레시피",
  "마일 티켓",
  "무 주식",
  "가구",
];

// 최근 검색어 초기값
const initialRecentKeywords = ["자전거", "에어팟", "닌텐도"];

// 가격 포맷팅 함수
function formatPrice(price: number): string {
  return price.toLocaleString("ko-KR") + "원";
}

// 필터 상태 타입
interface FilterState {
  category: string[];
  currencyType: string[];
  tradeType: string[];
  priceMin: string;
  priceMax: string;
}

// 검색 결과 아이템 컴포넌트
function SearchResultItem({ post }: { post: (typeof mockSearchResults)[0] }) {
  return (
    <Link
      href={`/post/${post.id}`}
      className="flex gap-4 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
    >
      <div className="w-28 h-28 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
        <img
          src="/icons/raccoon_bill.svg"
          alt="상품 카테고리"
          className="w-full h-full object-cover"
        />
      </div>
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

// 체크박스 필터 바텀시트 컴포넌트 (카테고리, 화폐, 거래유형용)
function CheckboxFilterModal({
  isOpen,
  onClose,
  title,
  options,
  selected,
  onApply,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  options: string[];
  selected: string[];
  onApply: (selected: string[]) => void;
}) {
  const [tempSelected, setTempSelected] = useState<string[]>(selected);

  // 모달이 열릴 때 현재 선택값으로 초기화
  useEffect(() => {
    if (isOpen) {
      setTempSelected(selected);
    }
  }, [isOpen, selected]);

  const handleToggle = (option: string) => {
    if (tempSelected.includes(option)) {
      setTempSelected(tempSelected.filter((item) => item !== option));
    } else {
      setTempSelected([...tempSelected, option]);
    }
  };

  const handleReset = () => {
    setTempSelected([]);
  };

  const handleApply = () => {
    onApply(tempSelected);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 bg-black/40 z-50"
        onClick={onClose}
      />

      {/* 바텀시트 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl w-full mx-auto animate-slide-up">
        {/* 핸들 */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="px-5 pb-8">
          {/* 제목 */}
          <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>

          {/* 구분선 */}
          <div className="border-t border-gray-200 mb-4" />

          {/* 옵션 목록 */}
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => handleToggle(option)}
                className="w-full flex items-center gap-3 py-3 hover:bg-gray-50 transition-colors"
              >
                {/* 체크박스 */}
                <div
                  className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                    tempSelected.includes(option)
                      ? "bg-primary border-primary"
                      : "border-gray-300"
                  }`}
                >
                  {tempSelected.includes(option) && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <span className="text-gray-800">{option}</span>
              </button>
            ))}
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleReset}
              className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              초기화
            </button>
            <button
              onClick={handleApply}
              className="flex-[2] py-3 bg-gray-900 rounded-lg text-white font-medium hover:bg-gray-800 transition-colors"
            >
              적용하기
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// 가격 필터 바텀시트 컴포넌트
function PriceFilterModal({
  isOpen,
  onClose,
  priceMin,
  priceMax,
  onApply,
}: {
  isOpen: boolean;
  onClose: () => void;
  priceMin: string;
  priceMax: string;
  onApply: (min: string, max: string) => void;
}) {
  const [minValue, setMinValue] = useState(priceMin);
  const [maxValue, setMaxValue] = useState(priceMax);
  const [priceError, setPriceError] = useState("");

  // 모달이 열릴 때 현재 값으로 초기화
  useEffect(() => {
    if (isOpen) {
      setMinValue(priceMin);
      setMaxValue(priceMax);
      setPriceError("");
    }
  }, [isOpen, priceMin, priceMax]);

  const handlePresetClick = (min: number, max: number) => {
    setMinValue(min.toString());
    setMaxValue(max.toString());
    setPriceError("");
  };

  const handleReset = () => {
    setMinValue("");
    setMaxValue("");
    setPriceError("");
  };

  const handleApply = () => {
    // 유효성 검사: 최소값이 최대값보다 크면 에러
    const min = minValue ? parseInt(minValue, 10) : 0;
    const max = maxValue ? parseInt(maxValue, 10) : Infinity;

    if (minValue && maxValue && min > max) {
      setPriceError("최소 가격이 최대 가격보다 클 수 없습니다");
      return;
    }

    setPriceError("");
    onApply(minValue, maxValue);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 bg-black/40 z-50"
        onClick={onClose}
      />

      {/* 바텀시트 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl w-full mx-auto animate-slide-up">
        {/* 핸들 */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="px-5 pb-8">
          {/* 제목 */}
          <h2 className="text-xl font-bold text-gray-900 mb-5">가격</h2>

          {/* 가격 입력 */}
          <div className="flex items-center gap-2 mb-4">
            <input
              type="text"
              placeholder="최소 금액"
              value={minValue}
              onChange={(e) => setMinValue(e.target.value.replace(/[^0-9]/g, ""))}
              className="flex-1 min-w-0 px-3 py-3 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary text-sm"
            />
            <span className="text-gray-400 flex-shrink-0">-</span>
            <input
              type="text"
              placeholder="최대 금액"
              value={maxValue}
              onChange={(e) => setMaxValue(e.target.value.replace(/[^0-9]/g, ""))}
              className="flex-1 min-w-0 px-3 py-3 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary text-sm"
            />
          </div>

          {/* 유효성 검사 에러 메시지 */}
          {priceError && (
            <p className="text-red-500 text-sm mb-4">{priceError}</p>
          )}

          {/* 가격 프리셋 */}
          <div className="flex flex-wrap gap-2 mb-6">
            {pricePresets.map((preset, index) => (
              <button
                key={index}
                onClick={() => handlePresetClick(preset.min, preset.max)}
                className={`px-4 py-2 rounded-full border text-sm transition-colors ${
                  minValue === preset.min.toString() && maxValue === preset.max.toString()
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-gray-300 text-gray-700 hover:border-gray-400"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* 버튼 */}
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              초기화
            </button>
            <button
              onClick={handleApply}
              className="flex-[2] py-3 bg-gray-900 rounded-lg text-white font-medium hover:bg-gray-800 transition-colors"
            >
              적용하기
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// 검색 페이지
export default function SearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<typeof mockSearchResults>([]);
  const [recentKeywords, setRecentKeywords] = useState<string[]>(initialRecentKeywords);

  // 필터 상태 (배열로 다중 선택 지원)
  const [filters, setFilters] = useState<FilterState>({
    category: [],
    currencyType: [],
    tradeType: [],
    priceMin: "",
    priceMax: "",
  });

  // 모달 상태
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [isTradeTypeModalOpen, setIsTradeTypeModalOpen] = useState(false);

  // 필터 적용 함수
  const applyFilters = (results: typeof mockSearchResults, currentFilters: FilterState) => {
    return results.filter((item) => {
      // 카테고리 필터
      if (currentFilters.category.length > 0 && !currentFilters.category.includes(item.category)) {
        return false;
      }
      // 화폐 유형 필터
      if (currentFilters.currencyType.length > 0 && !currentFilters.currencyType.includes(item.currencyType)) {
        return false;
      }
      // 거래 유형 필터
      if (currentFilters.tradeType.length > 0 && !currentFilters.tradeType.includes(item.tradeType)) {
        return false;
      }
      // 가격 필터
      if (currentFilters.priceMin && item.price < parseInt(currentFilters.priceMin)) {
        return false;
      }
      if (currentFilters.priceMax && item.price > parseInt(currentFilters.priceMax)) {
        return false;
      }
      return true;
    });
  };

  // 검색 실행
  const handleSearch = (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);
    let results = mockSearchResults.filter((item) =>
      item.title.toLowerCase().includes(query.toLowerCase())
    );
    results = applyFilters(results, filters);
    setSearchResults(results);
  };

  // 카테고리 필터 적용
  const handleCategoryApply = (selected: string[]) => {
    const newFilters = { ...filters, category: selected };
    setFilters(newFilters);
    if (isSearching && searchQuery) {
      let results = mockSearchResults.filter((item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      results = applyFilters(results, newFilters);
      setSearchResults(results);
    }
  };

  // 화폐 필터 적용
  const handleCurrencyApply = (selected: string[]) => {
    const newFilters = { ...filters, currencyType: selected };
    setFilters(newFilters);
    if (isSearching && searchQuery) {
      let results = mockSearchResults.filter((item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      results = applyFilters(results, newFilters);
      setSearchResults(results);
    }
  };

  // 거래유형 필터 적용
  const handleTradeTypeApply = (selected: string[]) => {
    const newFilters = { ...filters, tradeType: selected };
    setFilters(newFilters);
    if (isSearching && searchQuery) {
      let results = mockSearchResults.filter((item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      results = applyFilters(results, newFilters);
      setSearchResults(results);
    }
  };

  // 가격 필터 적용
  const handlePriceApply = (min: string, max: string) => {
    const newFilters = { ...filters, priceMin: min, priceMax: max };
    setFilters(newFilters);
    if (isSearching && searchQuery) {
      let results = mockSearchResults.filter((item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      results = applyFilters(results, newFilters);
      setSearchResults(results);
    }
  };

  // 검색어 입력 핸들러 (onKeyDown 사용 - onKeyPress deprecated)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch(searchQuery);
    }
  };

  // 키워드 클릭 핸들러
  const handleKeywordClick = (keyword: string) => {
    setSearchQuery(keyword);
    handleSearch(keyword);
  };

  // 최근 검색어 개별 삭제
  const handleRemoveKeyword = (e: React.MouseEvent, keyword: string) => {
    e.stopPropagation();
    setRecentKeywords((prev) => prev.filter((k) => k !== keyword));
  };

  // 최근 검색어 전체 삭제
  const handleClearAllKeywords = () => {
    setRecentKeywords([]);
  };

  // 검색어 초기화
  const handleClearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
    setSearchResults([]);
  };

  // 필터 라벨 함수들
  const getCategoryLabel = () => {
    if (filters.category.length === 0) return "카테고리";
    if (filters.category.length === 1) return filters.category[0];
    return `카테고리 ${filters.category.length}`;
  };

  const getCurrencyLabel = () => {
    if (filters.currencyType.length === 0) return "화폐";
    if (filters.currencyType.length === 1) return filters.currencyType[0];
    return `화폐 ${filters.currencyType.length}`;
  };

  const getTradeTypeLabel = () => {
    if (filters.tradeType.length === 0) return "거래유형";
    if (filters.tradeType.length === 1) return filters.tradeType[0];
    return `거래유형 ${filters.tradeType.length}`;
  };

  const getPriceLabel = () => {
    if (filters.priceMin && filters.priceMax) {
      return `${parseInt(filters.priceMin).toLocaleString()}원 - ${parseInt(filters.priceMax).toLocaleString()}원`;
    }
    if (filters.priceMin) {
      return `${parseInt(filters.priceMin).toLocaleString()}원 이상`;
    }
    if (filters.priceMax) {
      return `${parseInt(filters.priceMax).toLocaleString()}원 이하`;
    }
    return "가격";
  };

  return (
    <MobileLayout hideNav>
      {/* 검색 헤더 */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="flex items-center gap-2 h-14 px-4">
          <button
            onClick={() => router.back()}
            className="p-1 -ml-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeftIcon className="text-gray-800" />
          </button>

          {/* 검색 입력창 */}
          <div className="flex-1 flex items-center bg-gray-100 rounded-lg px-3 py-2">
            <SearchIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="검색어를 입력하세요"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 ml-2 bg-transparent text-gray-800 placeholder-gray-400 focus:outline-none"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {/* 검색 버튼 */}
          <button
            onClick={() => handleSearch(searchQuery)}
            className="px-3 py-2 text-primary font-medium hover:bg-gray-100 rounded-lg transition-colors"
          >
            검색
          </button>
        </div>
      </header>

      {/* 검색 전 화면 */}
      {!isSearching && (
        <div className="p-4">
          {/* 최근 검색어 */}
          {recentKeywords.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900">최근 검색어</h2>
                <button
                  onClick={handleClearAllKeywords}
                  disabled={recentKeywords.length === 0}
                  className="text-sm text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  전체 삭제
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentKeywords.map((keyword) => (
                  <div
                    key={keyword}
                    className="flex items-center bg-gray-100 rounded-full text-sm hover:bg-gray-200 transition-colors"
                  >
                    <button
                      onClick={() => handleKeywordClick(keyword)}
                      className="px-3 py-1.5 text-gray-700"
                    >
                      {keyword}
                    </button>
                    <button
                      onClick={(e) => handleRemoveKeyword(e, keyword)}
                      className="pr-2 py-1.5 text-gray-400 hover:text-gray-600"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 인기 검색어 */}
          <div>
            <h2 className="font-semibold text-gray-900 mb-3">인기 검색어</h2>
            <div className="flex flex-wrap gap-2">
              {popularKeywords.map((keyword, index) => (
                <button
                  key={index}
                  onClick={() => handleKeywordClick(keyword)}
                  className="px-3 py-1.5 bg-primary-light/30 text-primary rounded-full text-sm hover:bg-primary-light/50 transition-colors"
                >
                  {keyword}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 검색 결과 */}
      {isSearching && (
        <div>
          {/* 검색 결과 개수 */}
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-primary">&quot;{searchQuery}&quot;</span> 검색 결과{" "}
              <span className="font-semibold">{searchResults.length}</span>건
            </p>
          </div>

          {/* 필터 탭 */}
          <div className="flex gap-2 px-4 py-3 overflow-x-auto border-b border-gray-100 bg-white">
            {/* 카테고리 필터 */}
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors flex items-center gap-1 whitespace-nowrap ${
                filters.category.length > 0
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-gray-300 text-gray-700"
              }`}
            >
              {getCategoryLabel()}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {/* 가격 필터 */}
            <button
              onClick={() => setIsPriceModalOpen(true)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors flex items-center gap-1 whitespace-nowrap ${
                filters.priceMin || filters.priceMax
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-gray-300 text-gray-700"
              }`}
            >
              {getPriceLabel()}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {/* 화폐 유형 필터 */}
            <button
              onClick={() => setIsCurrencyModalOpen(true)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors flex items-center gap-1 whitespace-nowrap ${
                filters.currencyType.length > 0
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-gray-300 text-gray-700"
              }`}
            >
              {getCurrencyLabel()}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {/* 거래 유형 필터 */}
            <button
              onClick={() => setIsTradeTypeModalOpen(true)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors flex items-center gap-1 whitespace-nowrap ${
                filters.tradeType.length > 0
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-gray-300 text-gray-700"
              }`}
            >
              {getTradeTypeLabel()}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          </div>

          {/* 결과 목록 */}
          {searchResults.length > 0 ? (
            <div>
              {searchResults.map((post) => (
                <SearchResultItem key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <span className="text-6xl mb-4">🔍</span>
              <p>검색 결과가 없어요</p>
              <p className="text-sm mt-1">다른 키워드로 검색해보세요!</p>
            </div>
          )}
        </div>
      )}

      {/* 카테고리 필터 모달 */}
      <CheckboxFilterModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="카테고리"
        options={categories}
        selected={filters.category}
        onApply={handleCategoryApply}
      />

      {/* 가격 필터 모달 */}
      <PriceFilterModal
        isOpen={isPriceModalOpen}
        onClose={() => setIsPriceModalOpen(false)}
        priceMin={filters.priceMin}
        priceMax={filters.priceMax}
        onApply={handlePriceApply}
      />

      {/* 화폐 필터 모달 */}
      <CheckboxFilterModal
        isOpen={isCurrencyModalOpen}
        onClose={() => setIsCurrencyModalOpen(false)}
        title="화폐"
        options={currencyTypes}
        selected={filters.currencyType}
        onApply={handleCurrencyApply}
      />

      {/* 거래유형 필터 모달 */}
      <CheckboxFilterModal
        isOpen={isTradeTypeModalOpen}
        onClose={() => setIsTradeTypeModalOpen(false)}
        title="거래유형"
        options={tradeTypes}
        selected={filters.tradeType}
        onApply={handleTradeTypeApply}
      />
    </MobileLayout>
  );
}
