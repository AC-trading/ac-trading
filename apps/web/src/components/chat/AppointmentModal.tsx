"use client";

import { useState } from "react";

interface AppointmentModalProps {
  otherUserNickname: string;
  onConfirm: (scheduledTradeAt: string) => void;
  onClose: () => void;
  isSubmitting: boolean;
  initialScheduledAt?: string | null;
}

// 약속 잡기 모달 (당근마켓 스타일)
export default function AppointmentModal({
  otherUserNickname,
  onConfirm,
  onClose,
  isSubmitting,
  initialScheduledAt,
}: AppointmentModalProps) {
  // 기존 약속이 있으면 해당 시간으로 초기화, 없으면 내일 + 30분 올림
  const getInitialDate = (): Date | null => {
    if (initialScheduledAt) {
      // 백엔드 UTC → 로컬 변환
      const dateStr = initialScheduledAt.endsWith('Z') || initialScheduledAt.includes('+')
        ? initialScheduledAt
        : initialScheduledAt + 'Z';
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) return d;
    }
    return null;
  };

  const initialDate = getInitialDate();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [selectedDate, setSelectedDate] = useState(() => {
    const base = initialDate || tomorrow;
    const y = base.getFullYear();
    const m = String(base.getMonth() + 1).padStart(2, "0");
    const d = String(base.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });

  const [selectedHour, setSelectedHour] = useState(() => {
    if (initialDate) {
      // Before: 분 반올림이 60이면 시간 미조정 (예: 14:55 → 14:00)
      // After: 분 반올림 60 시 시간 +1 (예: 14:55 → 15:00)
      const m = initialDate.getMinutes();
      const rounded = Math.round(m / 10) * 10;
      const h = rounded >= 60 ? (initialDate.getHours() + 1) % 24 : initialDate.getHours();
      return String(h).padStart(2, "0");
    }
    const now = new Date();
    const minutes = now.getMinutes();
    // Before: minutes > 30 → 정확히 30분일 때 올림 안 됨
    // After: minutes >= 30 → 30분 이상이면 다음 시간으로 올림
    if (minutes >= 30) {
      const next = new Date(now.getTime());
      next.setHours(next.getHours() + 1);
      next.setMinutes(0);
      return String(next.getHours()).padStart(2, "0");
    }
    return String(now.getHours()).padStart(2, "0");
  });

  const [selectedMinute, setSelectedMinute] = useState(() => {
    if (initialDate) {
      // 10분 단위에 맞추기
      const m = initialDate.getMinutes();
      const rounded = Math.round(m / 10) * 10;
      return String(rounded >= 60 ? 0 : rounded).padStart(2, "0");
    }
    const now = new Date();
    const minutes = now.getMinutes();
    // Before: minutes > 30 → 30분일 때 "30" 반환 (올림 안 됨)
    // After: minutes >= 30 → 30분 이상이면 "00" (다음 시간 올림과 일치)
    if (minutes >= 30) return "00";
    if (minutes > 0) return "30";
    return "00";
  });

  // 날짜 포맷 표시 (2월 10일 화요일)
  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayNames = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
    const dayName = dayNames[date.getDay()];
    return `${month}월 ${day}일 ${dayName}`;
  };

  // 시간 포맷 표시 (오전 12:30)
  const formatDisplayTime = (hour: string, minute: string) => {
    const h = parseInt(hour);
    const ampm = h >= 12 ? "오후" : "오전";
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${ampm} ${h12}:${minute}`;
  };

  // 약속 확정
  const handleConfirm = () => {
    // ISO 8601 형식 (LocalDateTime 호환)
    const scheduledTradeAt = `${selectedDate}T${selectedHour}:${selectedMinute}:00`;
    // 선택한 일시가 현재보다 이후인지 검증
    const selectedDateTime = new Date(scheduledTradeAt);
    if (selectedDateTime <= new Date()) {
      alert("현재 시각 이후의 시간을 선택해주세요.");
      return;
    }
    onConfirm(scheduledTradeAt);
  };

  // 오늘 이후만 선택 가능
  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="w-full bg-white rounded-t-2xl overflow-hidden animate-slide-up max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <div className="w-6" />
        </div>

        {/* 타이틀 */}
        <div className="px-6 pb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {initialScheduledAt ? "약속 시간 변경" : `${otherUserNickname}님과 약속`}
          </h2>
        </div>

        {/* 날짜 선택 */}
        <div className="px-6 py-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold text-gray-900">날짜</span>
            <label className="flex items-center gap-2 cursor-pointer text-gray-500 hover:text-gray-700">
              <span>{formatDisplayDate(selectedDate)}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
              <input
                type="date"
                value={selectedDate}
                min={minDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="absolute opacity-0 w-0 h-0"
              />
            </label>
          </div>
        </div>

        {/* 시간 선택 */}
        <div className="px-6 py-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold text-gray-900">시간</span>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">
                {formatDisplayTime(selectedHour, selectedMinute)}
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
          {/* 시간 선택 드롭다운 */}
          <div className="flex items-center gap-3 mt-3">
            <select
              value={selectedHour}
              onChange={(e) => setSelectedHour(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:border-[#7ECEC5]"
            >
              {Array.from({ length: 24 }, (_, i) => {
                const hour = String(i).padStart(2, "0");
                const ampm = i >= 12 ? "오후" : "오전";
                const h12 = i === 0 ? 12 : i > 12 ? i - 12 : i;
                return (
                  <option key={hour} value={hour}>
                    {ampm} {h12}시
                  </option>
                );
              })}
            </select>
            <select
              value={selectedMinute}
              onChange={(e) => setSelectedMinute(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:border-[#7ECEC5]"
            >
              {["00", "10", "20", "30", "40", "50"].map((m) => (
                <option key={m} value={m}>
                  {m}분
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 완료 버튼 */}
        <div className="p-6 pb-8">
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="w-full py-4 bg-[#5BBFB3] text-white font-semibold rounded-xl hover:bg-[#4DAE9F] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-lg"
          >
            {isSubmitting ? "처리 중..." : "완료"}
          </button>
        </div>
      </div>
    </div>
  );
}
