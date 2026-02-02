#!/bin/bash
# kakao-login 플러그인이 추가한 하드코딩된 Kotlin 버전 제거
# Expo SDK 53 기본 버전 사용

echo "=== Removing hardcoded Kotlin version ==="

# build.gradle에서 하드코딩된 kotlin-gradle-plugin 버전 라인 제거
if [ -f "android/build.gradle" ]; then
  # 버전이 명시된 kotlin-gradle-plugin classpath 라인 제거
  if grep -q "kotlin-gradle-plugin:[0-9]" android/build.gradle; then
    sed -i "/classpath.*kotlin-gradle-plugin:[0-9]/d" android/build.gradle
    echo "✓ build.gradle: removed hardcoded kotlin-gradle-plugin version"
  else
    echo "⚠ build.gradle: no hardcoded kotlin version found"
  fi
fi

# gradle.properties에서 kotlinVersion 라인 제거 (Expo 기본값 사용)
if [ -f "android/gradle.properties" ]; then
  if grep -q "^android.kotlinVersion=" android/gradle.properties; then
    sed -i "/^android.kotlinVersion=/d" android/gradle.properties
    echo "✓ gradle.properties: removed kotlinVersion (using Expo default)"
  else
    echo "⚠ gradle.properties: no kotlinVersion found"
  fi
fi

echo "=== Kotlin version fix complete ==="

# 검증
echo "=== Verification ==="
echo "build.gradle kotlin references:"
grep -E "kotlin" android/build.gradle || echo "  (none with version)"
echo ""
echo "gradle.properties kotlin references:"
grep -E "kotlin" android/gradle.properties || echo "  (none)"
