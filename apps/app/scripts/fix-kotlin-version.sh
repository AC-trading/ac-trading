#!/bin/bash
# Kakao 플러그인의 Kotlin 1.5.10을 2.0.21로 교체
# Expo 54 + RN 0.81 호환 버전

KOTLIN_VERSION="2.0.21"

echo "Setting Kotlin version to $KOTLIN_VERSION..."

# build.gradle: 1.5.10 → 2.0.21
if [ -f "android/build.gradle" ]; then
  sed -i "s/kotlin-gradle-plugin:1.5.10/kotlin-gradle-plugin:$KOTLIN_VERSION/" android/build.gradle
  echo "✓ build.gradle updated"
fi

# gradle.properties: 1.5.10 → 2.0.21
if [ -f "android/gradle.properties" ]; then
  sed -i "s/android.kotlinVersion=1.5.10/android.kotlinVersion=$KOTLIN_VERSION/" android/gradle.properties
  echo "✓ gradle.properties updated"
fi

echo "Kotlin version set to $KOTLIN_VERSION"
