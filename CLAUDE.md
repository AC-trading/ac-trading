컨셉: 모여봐요 동물의 숲 아이템 거래 플랫폼 (당근마켓 벤치마킹)
절대로 하드코딩 하지 말고 환경 변수로 분리할것
Redis 는 MVP 이후 기능이므로 지금은 안할것임.
스택: Next.js(프론트) + Spring Boot(백엔드) + PostgreSQL(Neon) + Cloudflare R2(이미지) + Redis(Upstash, MVP 이후)
앱: React Native WebView + 네이티브(OAuth (일반 로그인 제거, 소셜 로그인만 구현), 푸시, 딥링크, 하단탭) - 플레이스토어 정책 충족용
인증: Cognito → 백엔드 콜백(/api/auth/callback) → JWT 발급. access token은 로컬스토리지, refresh token은 HttpOnly 쿠키
인프라: Vercel(무료) + Railway($5~15) + Neon/Upstash/R2(무료) | 월 10만원 이하
전략: 웹 먼저 배포 → 피드백 수집 → 앱 심사 병행
MVP 기능: 로그인, 거래글 CRUD, 이미지 업로드, 검색/필터, 실시간 채팅, 알림
코딩 규칙: 한국어 주석, PR 리뷰로 고친것은 주석에 Before,After 달아둘것
 Controller-Service-Repository 레이어, 도메인별 패키지 분리, DTO/Entity 분리, URL 환경변수 처리, 커밋 prefix 사용
앱 디버그 로그: __DEV__ 가드 사용 (프로덕션 빌드에서 자동 제거)

[OAuth 설정 - 검증 완료]
Google Cloud Console:
- OAuth 동의 화면: 테스트 모드, 테스트 사용자 등록 완료
- Web 클라이언트 ID: 641164748452-dibnrej3oi01v4e8ho0of4dlk8bqos7c.apps.googleusercontent.com (webClientId로 사용)
- Android 클라이언트: com.actrading.app + SHA-1 등록됨
- EAS 빌드용 SHA-1: EAS 관리 keystore (프로덕션) - 정상 작동
- 로컬 빌드용 SHA-1: 5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25 (debug.keystore) - 등록했으나 작동 안함 (원인 미확인)

Kakao Developer Console:
- 네이티브 앱 키: 7fb89541b99776947d88908473b47ad0
- 키 해시 (EAS): QjUEu2gLbCxoJtmLKFqgXGd1K30=
- 키 해시 (로컬): Xo8WBi6jzSxKDVR4drqm84yr9iU=
- 패키지명: com.actrading.app
- SDK: @react-native-seoul/kakao-login (네이티브 SDK)

[알려진 이슈]
- 로컬 빌드(npx expo run:android --variant release)에서 Google OAuth 실패
- EAS 클라우드 빌드에서는 정상 작동
- SHA-1, 패키지명, 테스트 사용자 모두 검증했으나 원인 미확인

프로젝트 구조/
├── acnh-web/          # Next.js (웹 프론트엔드)
│   └── Vercel 배포
│
├── acnh-app/          # React Native (앱 껍데기)
│   └── 스토어 배포
│
└── acnh-server/       # Spring Boot (백엔드)
    └── Railway 배포


[메인 컬러]
    #FFFFF0
    #adb5bd
    #BAE8E7 채팅 물결
    #7ECEC5 민트
    #5BBFB3 채팅 전송