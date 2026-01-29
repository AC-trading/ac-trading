#!/bin/bash
# Kotlin 버전을 2.0.21로 강제 설정
# Expo 54 + RN 0.81 호환 버전

KOTLIN_VERSION="2.0.21"

echo "=== Fixing Kotlin version to $KOTLIN_VERSION ==="

# build.gradle 수정
if [ -f "android/build.gradle" ]; then
  # 1.5.10이 있으면 교체
  if grep -q "kotlin-gradle-plugin:1.5.10" android/build.gradle; then
    sed -i "s/kotlin-gradle-plugin:1.5.10/kotlin-gradle-plugin:$KOTLIN_VERSION/" android/build.gradle
    echo "✓ build.gradle: 1.5.10 → $KOTLIN_VERSION"
  else
    echo "⚠ build.gradle: 1.5.10 not found (using default)"
  fi
fi

# gradle.properties 수정
if [ -f "android/gradle.properties" ]; then
  # android.kotlinVersion이 있으면 교체, 없으면 추가
  if grep -q "^android.kotlinVersion=" android/gradle.properties; then
    sed -i "s/^android.kotlinVersion=.*/android.kotlinVersion=$KOTLIN_VERSION/" android/gradle.properties
    echo "✓ gradle.properties: updated to $KOTLIN_VERSION"
  else
    echo "android.kotlinVersion=$KOTLIN_VERSION" >> android/gradle.properties
    echo "✓ gradle.properties: added $KOTLIN_VERSION"
  fi
fi

echo "=== Kotlin version fix complete ==="

# 검증
echo "=== Verification ==="
grep -E "kotlin" android/build.gradle android/gradle.properties || echo "No kotlin found"
