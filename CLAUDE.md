동숲 거래앱 프로젝트
컨셉: 모여봐요 동물의 숲 아이템 거래 플랫폼 (당근마켓 벤치마킹)
스택: Next.js(프론트) + Spring Boot(백엔드) + PostgreSQL(Neon) + Redis(Upstash) + Cloudflare R2(이미지)
앱: React Native WebView + 네이티브(OAuth, 푸시, 딥링크, 하단탭) - 플레이스토어 정책 충족용
인증: Cognito → 백엔드 콜백(/api/auth/callback) → JWT 발급. access token은 로컬스토리지, refresh token은 HttpOnly 쿠키
인프라: Vercel(무료) + Railway($5~15) + Neon/Upstash/R2(무료) | 월 10만원 이하
전략: 웹 먼저 배포 → 피드백 수집 → 앱 심사 병행
MVP 기능: 로그인, 거래글 CRUD, 이미지 업로드, 검색/필터, 실시간 채팅, 알림
코딩 규칙: 한국어 주석, Controller-Service-Repository 레이어, 도메인별 패키지 분리, DTO/Entity 분리, URL 환경변수 처리, 커밋 prefix 사용

프로젝트 구조/
├── acnh-web/          # Next.js (웹 프론트엔드)
│   └── Vercel 배포
│
├── acnh-app/          # React Native (앱 껍데기)
│   └── 스토어 배포
│
└── acnh-server/       # Spring Boot (백엔드)
    └── Railway 배포