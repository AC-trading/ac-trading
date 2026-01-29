# 자주 쓰는 명령어

## 앱 빌드

```bash
# EAS 클라우드 빌드
eas build --platform android --profile preview

# EAS 빌드 취소
eas build:cancel

# EAS 빌드 목록 확인
eas build:list --status in_progress

# 로컬 빌드 (release)
npx expo run:android --variant release --device
```

## 앱 설치/관리

```bash
# 앱 데이터 삭제
adb shell pm clear com.actrading.app

# 앱 삭제
adb uninstall com.actrading.app

# 설치된 APK 경로 확인
adb shell pm path com.actrading.app
```

## 서명 확인

```bash
# debug.keystore SHA-1 확인
keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android

# 설치된 APK 서명 확인
adb pull /data/app/.../base.apk temp.apk
apksigner verify --print-certs temp.apk
```

## 로그 확인

```bash
# React Native JS 로그
adb logcat -s "ReactNativeJS"

# 전체 로그 (필터링)
adb logcat | grep -iE "google|oauth|kakao"
```

## 개발 서버

```bash
# Metro 번들러 시작
npx expo start

# 캐시 클리어 후 시작
npx expo start --clear
```
