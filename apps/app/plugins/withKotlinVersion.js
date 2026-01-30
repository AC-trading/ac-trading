// Kakao 플러그인이 추가하는 오래된 Kotlin 버전(1.5.10)을 제거하는 config plugin
// 참고: 메인 수정은 scripts/fix-kotlin-version.sh에서 처리
// 이 플러그인은 로컬 개발용 백업

const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

function withKotlinVersion(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;

      const gradlePropsPath = path.join(projectRoot, 'android', 'gradle.properties');
      if (fs.existsSync(gradlePropsPath)) {
        let content = fs.readFileSync(gradlePropsPath, 'utf-8');
        content = content.replace(/^android\.kotlinVersion=.*\n?/gm, '');
        fs.writeFileSync(gradlePropsPath, content);
      }

      const buildGradlePath = path.join(projectRoot, 'android', 'build.gradle');
      if (fs.existsSync(buildGradlePath)) {
        let content = fs.readFileSync(buildGradlePath, 'utf-8');
        // 1.5.10 버전만 타깃 (kakao-login 플러그인이 추가하는 오래된 버전)
        content = content.replace(
          /\s*classpath\s*['"]org\.jetbrains\.kotlin:kotlin-gradle-plugin:1\.5\.10['"]\n?/g,
          '\n'
        );
        fs.writeFileSync(buildGradlePath, content);
      }

      return config;
    },
  ]);
}

module.exports = withKotlinVersion;
