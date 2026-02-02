const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// kakao-login 플러그인이 추가한 하드코딩된 Kotlin 버전을 제거하는 플러그인
// withDangerousMod를 사용하여 모든 플러그인 실행 후 파일 수정
const withFixKotlinVersion = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const buildGradlePath = path.join(
        config.modRequest.platformProjectRoot,
        'build.gradle'
      );

      if (fs.existsSync(buildGradlePath)) {
        let contents = fs.readFileSync(buildGradlePath, 'utf-8');

        // 하드코딩된 kotlin-gradle-plugin 버전 라인 제거
        // 예: classpath 'org.jetbrains.kotlin:kotlin-gradle-plugin:1.5.10'
        contents = contents.replace(
          /[ \t]*classpath\s+['"]org\.jetbrains\.kotlin:kotlin-gradle-plugin:\d+\.\d+\.\d+['"]\s*\n/g,
          ''
        );

        fs.writeFileSync(buildGradlePath, contents);
      }

      return config;
    },
  ]);
};

module.exports = withFixKotlinVersion;
