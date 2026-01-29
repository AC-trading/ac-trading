#!/bin/bash
# Kakao 플러그인이 추가하는 오래된 Kotlin 버전(1.5.10)을 제거하는 스크립트
# EAS 빌드에서 prebuild 후 실행됨

echo "Fixing Kotlin version in android/build.gradle..."

# build.gradle에서 하드코딩된 Kotlin 버전 제거
if [ -f "android/build.gradle" ]; then
  sed -i "s/classpath 'org.jetbrains.kotlin:kotlin-gradle-plugin:1.5.10'//" android/build.gradle
  echo "✓ Removed hardcoded Kotlin 1.5.10 from build.gradle"
fi

# gradle.properties에서 android.kotlinVersion 제거
if [ -f "android/gradle.properties" ]; then
  sed -i '/^android\.kotlinVersion=1\.5\.10$/d' android/gradle.properties
  echo "✓ Removed android.kotlinVersion=1.5.10 from gradle.properties"
fi

echo "Kotlin version fix complete!"
