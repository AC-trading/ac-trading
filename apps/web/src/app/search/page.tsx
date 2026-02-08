"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MobileLayout } from "@/components/common";
import { ChevronLeftIcon, SearchIcon, HeartIcon } from "@/components/icons";
import {
  searchPosts,
  getCategories,
  formatPrice as apiFormatPrice,
  formatRelativeTime,
  extractImageUrls,
  Post,
  Category,
} from "@/lib/postApi";

// 화폐 유형 매핑 (한국어 라벨 → API enum)
const CURRENCY_MAP: Record<string, "BELL" | "MILE_TICKET"> = {
  "벨": "BELL",
  "마일": "MILE_TICKET",
};

// 거래 유형 매핑 (한국어 라벨 → API enum)
const TRADE_TYPE_MAP: Record<string, "SELL" | "BUY"> = {
  "팔아요": "SELL",
  "구해요": "BUY",
};

// 화폐 유형 목록
const currencyTypes = ["벨", "마일"];

// 거래 유형 목록
const tradeTypes = ["팔아요", "구해요"];

// 가격 프리셋
const pricePresets = [
  { label: "~10,000", min: 0, max: 10000 },
  { label: "10,000 ~ 100,000", min: 10000, max: 100000 },
  { label: "100,000~", min: 100000, max: 0 },  // max: 0 = 상한 없음
];

// 인기 검색어 (동물의 숲 관련)
// 인기 검색어: 카테고리 로드 후 동적 생성 (하드코딩 제거)

// localStorage 키
const RECENT_KEYWORDS_KEY = "ac-trading-recent-keywords";

// 최근 검색어 로드
// Before: JSON.parse 결과가 배열인지 검증하지 않아, localStorage 값이 변조 시 런타임 에러 가능
// After: Array.isArray 체크 추가
function loadRecentKeywords(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(RECENT_KEYWORDS_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// 최근 검색어 저장
// Before: localStorage.setItem에 try/catch 없음 → Safari 개인정보 보호 모드나 용량 초과 시 예외 발생
// After: try/catch 추가
function saveRecentKeywords(keywords: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(RECENT_KEYWORDS_KEY, JSON.stringify(keywords));
  } catch {
    // Safari 개인정보 보호 모드 또는 localStorage 용량 초과 시 무시
  }
}

// 최근 검색어에 추가 (중복 제거, 최대 10개)
function addRecentKeyword(keywords: string[], keyword: string): string[] {
  const filtered = keywords.filter((k) => k !== keyword);
  const updated = [keyword, ...filtered].slice(0, 10);
  saveRecentKeywords(updated);
  return updated;
}

// 필터 상태 타입
interface FilterState {
  category: string[];
  currencyType: string[];
  tradeType: string[];
  priceMin: string;
  priceMax: string;
}

// 검색 결과 아이템 컴포넌트 (실제 Post 타입 사용)
function SearchResultItem({ post }: { post: Post }) {
  const thumbnailUrl = extractImageUrls(post.description)[0];

  return (
    <Link
      href={`/post/${post.id}`}
      className="flex gap-4 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
    >
      {/* 상품 썸네일 - 업로드된 이미지가 있으면 첫 번째 이미지, 없으면 기본 아이콘 */}
      <div className="w-28 h-28 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={post.itemName}
            className="w-full h-full object-cover"
          />
        ) : (
          <Image
            src={process.env.NEXT_PUBLIC_ICON_RACCOON || "/icons/raccoon_bill.svg"}
            alt="상품 카테고리"
            width={112}
            height={112}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <div className="flex-1 flex flex-col justify-between py-1">
        <div>
          <h3 className="font-medium text-black line-clamp-2">{post.itemName}</h3>
          <p className="text-xs text-black mt-1">
            {post.userIslandName || "섬 이름 없음"} · {formatRelativeTime(post.bumpedAt || post.createdAt)}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <p className="font-bold text-primary">{apiFormatPrice(post.price, post.currencyType)}</p>
          <div className="flex items-center gap-3 text-gray-400">
            {post.likeCount > 0 && (
              <span className="flex items-center gap-1">
                <HeartIcon />
                <span className="text-xs">{post.likeCount}</span>
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
    setMinValue(min > 0 ? min.toString() : "");
    setMaxValue(max > 0 ? max.toString() : "");
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
                  minValue === (preset.min > 0 ? preset.min.toString() : "") &&
                  maxValue === (preset.max > 0 ? preset.max.toString() : "")
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
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [recentKeywords, setRecentKeywords] = useState<string[]>([]);

  // 카테고리 목록 (API에서 로드)
  const [categories, setCategories] = useState<Category[]>([]);
  const defaultCategoryNames = ["가구", "옷", "벽지", "바닥", "잡화", "레시피", "화석", "미술품"];
  const categoryNames = categories.length > 0 ? categories.map((c) => c.name) : defaultCategoryNames;

  // 인기 검색어: 카테고리명 기반 동적 생성
  const popularKeywords = categoryNames;

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

  // 카테고리 로드 실패 상태
  const [categoryError, setCategoryError] = useState(false);

  // 카테고리 로드 함수 (재시도 가능)
  // Before: 카테고리 로드 실패 시 빈 배열 → 필터 모달에 빈 목록
  // After: 실패 시 기본 카테고리 유지 + 재시도 경로 제공
  const loadCategories = useCallback(async () => {
    try {
      setCategoryError(false);
      const response = await getCategories();
      setCategories(response.categories);
    } catch (err) {
      console.error("카테고리 로드 실패:", err);
      setCategoryError(true);
    }
  }, []);

  // 카테고리 로드 + 최근 검색어 로드
  useEffect(() => {
    loadCategories();
    setRecentKeywords(loadRecentKeywords());
  }, [loadCategories]);

  // 필터 → API 파라미터 변환
  const buildSearchParams = useCallback(
    (query: string, currentFilters: FilterState) => {
      const params: Parameters<typeof searchPosts>[0] = {
        keyword: query,
        page: 0,
        size: 50,
      };

      // 카테고리 필터: API에서 로드한 카테고리가 있을 때만 ID 매핑 시도
      // Before: categories 빈 배열(API 실패) 시 find가 항상 undefined → 선택한 필터가 무시됨
      // After: categories가 비어있으면 카테고리 필터 스킵
      if (currentFilters.category.length > 0 && categories.length > 0) {
        const categoryIds = currentFilters.category
          .map((name) => categories.find((c) => c.name === name)?.id)
          .filter((id): id is number => id !== undefined);
        if (categoryIds.length > 0) params.categoryId = categoryIds;
      }

      // 화폐 유형 필터: 선택된 화폐 유형 배열 전달 (다중 선택 지원)
      // Before: 매핑 테이블에 없는 키 → undefined 포함 가능
      // After: .filter(Boolean)로 undefined 방어
      if (currentFilters.currencyType.length > 0) {
        const mapped = currentFilters.currencyType
          .map((ct) => CURRENCY_MAP[ct])
          .filter((v): v is "BELL" | "MILE_TICKET" => v !== undefined);
        if (mapped.length > 0) params.currencyType = mapped;
      }

      // 거래 유형 필터: 선택된 거래 유형 배열 전달 (다중 선택 지원)
      if (currentFilters.tradeType.length > 0) {
        const mapped = currentFilters.tradeType
          .map((tt) => TRADE_TYPE_MAP[tt])
          .filter((v): v is "SELL" | "BUY" => v !== undefined);
        if (mapped.length > 0) params.postType = mapped;
      }

      // 가격 필터
      if (currentFilters.priceMin) {
        params.minPrice = parseInt(currentFilters.priceMin, 10);
      }
      if (currentFilters.priceMax) {
        params.maxPrice = parseInt(currentFilters.priceMax, 10);
      }

      return params;
    },
    [categories]
  );

  // 검색 실행 (API 호출)
  const executeSearch = useCallback(
    async (query: string, currentFilters: FilterState) => {
      if (!query.trim()) return;

      setIsSearching(true);
      setIsLoadingResults(true);
      setSearchError(null);

      try {
        const params = buildSearchParams(query, currentFilters);
        const response = await searchPosts(params);
        setSearchResults(response.posts);
        setTotalResults(response.totalElements);
      } catch (err) {
        console.error("검색 실패:", err);
        setSearchError(err instanceof Error ? err.message : "검색에 실패했습니다");
        setSearchResults([]);
        setTotalResults(0);
      } finally {
        setIsLoadingResults(false);
      }
    },
    [buildSearchParams]
  );

  // 검색 실행 핸들러
  const handleSearch = (query: string) => {
    if (!query.trim()) return;

    // 최근 검색어 추가
    setRecentKeywords((prev) => addRecentKeyword(prev, query.trim()));
    executeSearch(query, filters);
  };

  // 필터 변경 시 재검색
  const handleFilterChange = useCallback(
    (newFilters: FilterState) => {
      setFilters(newFilters);
      if (isSearching && searchQuery.trim()) {
        executeSearch(searchQuery, newFilters);
      }
    },
    [isSearching, searchQuery, executeSearch]
  );

  // 카테고리 필터 적용
  const handleCategoryApply = (selected: string[]) => {
    handleFilterChange({ ...filters, category: selected });
  };

  // 화폐 필터 적용
  const handleCurrencyApply = (selected: string[]) => {
    handleFilterChange({ ...filters, currencyType: selected });
  };

  // 거래유형 필터 적용
  const handleTradeTypeApply = (selected: string[]) => {
    handleFilterChange({ ...filters, tradeType: selected });
  };

  // 가격 필터 적용
  const handlePriceApply = (min: string, max: string) => {
    handleFilterChange({ ...filters, priceMin: min, priceMax: max });
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
    // 최근 검색어 추가
    setRecentKeywords((prev) => addRecentKeyword(prev, keyword));
    executeSearch(keyword, filters);
  };

  // 최근 검색어 개별 삭제
  const handleRemoveKeyword = (e: React.MouseEvent, keyword: string) => {
    e.stopPropagation();
    setRecentKeywords((prev) => {
      const updated = prev.filter((k) => k !== keyword);
      saveRecentKeywords(updated);
      return updated;
    });
  };

  // 최근 검색어 전체 삭제
  const handleClearAllKeywords = () => {
    setRecentKeywords([]);
    saveRecentKeywords([]);
  };

  // 검색어 초기화
  const handleClearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
    setSearchResults([]);
    setTotalResults(0);
    setSearchError(null);
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
      return `${parseInt(filters.priceMin, 10).toLocaleString()} - ${parseInt(filters.priceMax, 10).toLocaleString()}`;
    }
    if (filters.priceMin) {
      return `${parseInt(filters.priceMin, 10).toLocaleString()} 이상`;
    }
    if (filters.priceMax) {
      return `${parseInt(filters.priceMax, 10).toLocaleString()} 이하`;
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
                  className="text-sm text-gray-400 hover:text-gray-600"
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
            <div className="flex items-center gap-2 mb-3">
              <h2 className="font-semibold text-gray-900">인기 검색어</h2>
              {categoryError && (
                <button
                  onClick={loadCategories}
                  className="text-xs text-primary hover:underline"
                >
                  새로고침
                </button>
              )}
            </div>
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
              <span className="font-semibold">{totalResults}</span>건
            </p>
          </div>

          {/* 필터 탭 */}
          <div className="flex gap-2 px-4 py-3 overflow-x-auto border-b border-gray-100 bg-white">
            {/* 카테고리 필터 - API 로드 실패 시 비활성화 (ID 매핑 불가) */}
            <button
              onClick={() => categories.length > 0 && setIsCategoryModalOpen(true)}
              disabled={categories.length === 0}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors flex items-center gap-1 whitespace-nowrap ${
                categories.length === 0
                  ? "border-gray-200 text-gray-400 cursor-not-allowed"
                  : filters.category.length > 0
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-gray-300 text-gray-700"
              }`}
            >
              {categories.length === 0 ? "카테고리" : getCategoryLabel()}
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

          {/* 로딩 상태 */}
          {isLoadingResults && (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            </div>
          )}

          {/* 에러 상태 */}
          {searchError && !isLoadingResults && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <p className="text-sm">{searchError}</p>
              <button
                onClick={() => executeSearch(searchQuery, filters)}
                className="mt-4 px-4 py-2 text-sm text-primary hover:underline"
              >
                다시 시도
              </button>
            </div>
          )}

          {/* 결과 목록 */}
          {!isLoadingResults && !searchError && searchResults.length > 0 && (
            <div>
              {searchResults.map((post) => (
                <SearchResultItem key={post.id} post={post} />
              ))}
            </div>
          )}

          {/* 빈 결과 */}
          {!isLoadingResults && !searchError && searchResults.length === 0 && (
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
        title={categoryError ? "카테고리 (기본 목록)" : "카테고리"}
        options={categoryNames}
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
