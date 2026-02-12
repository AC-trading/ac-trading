/**
 * 무 점수 구간별 색상 반환
 * - 100 미만: #F08080 (연한 빨강)
 * - 100~110: #adb5bd (회색, 기본)
 * - 110 초과: #7ECEC5 → #5BBFB3 (민트, 높을수록 진해짐)
 */
export function getMannerScoreColor(score: number): string {
  if (score < 100) return "#F08080";
  if (score <= 110) return "#adb5bd";

  // 110 초과: #7ECEC5(rgb 126,206,197) → #5BBFB3(rgb 91,191,179) 그라데이션
  const t = Math.min((score - 110) / 90, 1); // 110~200 범위에서 0~1로 정규화
  const r = Math.round(126 + (91 - 126) * t);
  const g = Math.round(206 + (191 - 206) * t);
  const b = Math.round(197 + (179 - 197) * t);
  return `rgb(${r}, ${g}, ${b})`;
}
