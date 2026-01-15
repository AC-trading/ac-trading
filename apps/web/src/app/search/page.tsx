"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MobileLayout } from "@/components/common";
import { ChevronLeftIcon, SearchIcon, HeartIcon, CommentIcon } from "@/components/icons";

// 더미 검색 결과 데이터
const mockSearchResults = [
  {
    id: 1,
    title: "에어팟 프로",
    location: "군자동",
    time: "3일 전",
    price: 220000,
    comments: 3,
    likes: 11,
    category: "가전",
    currencyType: "벨",
    tradeType: "팔아요",
  },
  {
    id: 2,
    title: "바이레도 블랑쉬 50ml",
    location: "광진구 구의제3동",
    time: "26초 전",
    price: 4000,
    comments: 0,
    likes: 2,
    category: "뷰티",
    currencyType: "마일",
    tradeType: "팔아요",
  },
  {
    id: 3,
    title: "아이폰 13프로맥스",
    location: "군자동",
    time: "1일 전",
    price: 1000000,
    comments: 0,
    likes: 0,
    category: "가전",
    currencyType: "벨",
    tradeType: "구해요",
  },
];

// 카테고리 목록
const categories = ["전체", "가구", "가전", "의류", "뷰티", "DIY", "화석", "기타"];

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

// 최근 검색어
const recentKeywords = ["자전거", "에어팟", "닌텐도"];

// 가격 포맷팅 함수
function formatPrice(price: number): string {
  return price.toLocaleString("ko-KR") + "원";
}

// 필터 상태 타입
interface FilterState {
  category: string;
  currencyType: string;
  tradeType: string;
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
          src="/icons/DIY.png"
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

  const handlePresetClick = (min: number, max: number) => {
    setMinValue(min.toString());
    setMaxValue(max.toString());
  };

  const handleReset = () => {
    setMinValue("");
    setMaxValue("");
  };

  const handleApply = () => {
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
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl max-w-[390px] mx-auto animate-slide-up">
        {/* 핸들 */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="px-5 pb-8">
          {/* 제목 */}
          <h2 className="text-xl font-bold text-gray-900 mb-5">가격</h2>

          {/* 가격 입력 */}
          <div className="flex items-center gap-3 mb-4">
            <input
              type="text"
              placeholder="최소 금액"
              value={minValue}
              onChange={(e) => setMinValue(e.target.value.replace(/[^0-9]/g, ""))}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary"
            />
            <span className="text-gray-400">-</span>
            <input
              type="text"
              placeholder="최대 금액"
              value={maxValue}
              onChange={(e) => setMaxValue(e.target.value.replace(/[^0-9]/g, ""))}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary"
            />
          </div>

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
              className="flex-[2] py-3 bg-primary rounded-lg text-white font-medium hover:bg-primary-dark transition-colors"
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

  // 필터 상태
  const [filters, setFilters] = useState<FilterState>({
    category: "전체",
    currencyType: "전체",
    tradeType: "전체",
    priceMin: "",
    priceMax: "",
  });

  // 가격 필터 모달 상태
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);

  // 검색 실행
  const handleSearch = (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);
    // TODO: 실제 API 호출
    // 임시로 더미 데이터 필터링
    let results = mockSearchResults.filter((item) =>
      item.title.toLowerCase().includes(query.toLowerCase())
    );

    // 필터 적용
    results = applyFilters(results);
    setSearchResults(results);
  };

  // 필터 적용 함수
  const applyFilters = (results: typeof mockSearchResults) => {
    return results.filter((item) => {
      // 카테고리 필터
      if (filters.category !== "전체" && item.category !== filters.category) {
        return false;
      }
      // 화폐 유형 필터
      if (filters.currencyType !== "전체" && item.currencyType !== filters.currencyType) {
        return false;
      }
      // 거래 유형 필터
      if (filters.tradeType !== "전체" && item.tradeType !== filters.tradeType) {
        return false;
      }
      // 가격 필터
      if (filters.priceMin && item.price < parseInt(filters.priceMin)) {
        return false;
      }
      if (filters.priceMax && item.price > parseInt(filters.priceMax)) {
        return false;
      }
      return true;
    });
  };

  // 필터 변경 시 재검색
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    if (isSearching && searchQuery) {
      let results = mockSearchResults.filter((item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      );

      // 새 필터로 적용
      results = results.filter((item) => {
        if (newFilters.category !== "전체" && item.category !== newFilters.category) return false;
        if (newFilters.currencyType !== "전체" && item.currencyType !== newFilters.currencyType) return false;
        if (newFilters.tradeType !== "전체" && item.tradeType !== newFilters.tradeType) return false;
        if (newFilters.priceMin && item.price < parseInt(newFilters.priceMin)) return false;
        if (newFilters.priceMax && item.price > parseInt(newFilters.priceMax)) return false;
        return true;
      });

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

      results = results.filter((item) => {
        if (newFilters.category !== "전체" && item.category !== newFilters.category) return false;
        if (newFilters.currencyType !== "전체" && item.currencyType !== newFilters.currencyType) return false;
        if (newFilters.tradeType !== "전체" && item.tradeType !== newFilters.tradeType) return false;
        if (min && item.price < parseInt(min)) return false;
        if (max && item.price > parseInt(max)) return false;
        return true;
      });

      setSearchResults(results);
    }
  };

  // 검색어 입력 핸들러
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(searchQuery);
    }
  };

  // 키워드 클릭 핸들러
  const handleKeywordClick = (keyword: string) => {
    setSearchQuery(keyword);
    handleSearch(keyword);
  };

  // 검색어 초기화
  const handleClearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
    setSearchResults([]);
  };

  // 가격 필터 라벨
  const getPriceFilterLabel = () => {
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
              onKeyPress={handleKeyPress}
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
                <button className="text-sm text-gray-400 hover:text-gray-600">
                  전체 삭제
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentKeywords.map((keyword, index) => (
                  <button
                    key={index}
                    onClick={() => handleKeywordClick(keyword)}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors flex items-center gap-1"
                  >
                    {keyword}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
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
              <span className="font-semibold text-primary">"{searchQuery}"</span> 검색 결과{" "}
              <span className="font-semibold">{searchResults.length}</span>건
            </p>
          </div>

          {/* 필터 탭 */}
          <div className="flex gap-2 px-4 py-3 overflow-x-auto border-b border-gray-100 bg-white">
            {/* 카테고리 필터 */}
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange("category", e.target.value)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors appearance-none cursor-pointer ${
                filters.category !== "전체"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-gray-300 text-gray-700"
              }`}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "전체" ? "카테고리" : cat}
                </option>
              ))}
            </select>

            {/* 가격 필터 */}
            <button
              onClick={() => setIsPriceModalOpen(true)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors flex items-center gap-1 whitespace-nowrap ${
                filters.priceMin || filters.priceMax
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-gray-300 text-gray-700"
              }`}
            >
              {getPriceFilterLabel()}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {/* 화폐 유형 필터 (벨/마일) */}
            <select
              value={filters.currencyType}
              onChange={(e) => handleFilterChange("currencyType", e.target.value)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors appearance-none cursor-pointer ${
                filters.currencyType !== "전체"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-gray-300 text-gray-700"
              }`}
            >
              <option value="전체">화폐</option>
              <option value="벨">벨</option>
              <option value="마일">마일</option>
            </select>

            {/* 거래 유형 필터 (구해요/팔아요) */}
            <select
              value={filters.tradeType}
              onChange={(e) => handleFilterChange("tradeType", e.target.value)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors appearance-none cursor-pointer ${
                filters.tradeType !== "전체"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-gray-300 text-gray-700"
              }`}
            >
              <option value="전체">거래유형</option>
              <option value="구해요">구해요</option>
              <option value="팔아요">팔아요</option>
            </select>
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

      {/* 가격 필터 모달 */}
      <PriceFilterModal
        isOpen={isPriceModalOpen}
        onClose={() => setIsPriceModalOpen(false)}
        priceMin={filters.priceMin}
        priceMax={filters.priceMax}
        onApply={handlePriceApply}
      />
    </MobileLayout>
  );
}
