const { withProjectBuildGradle } = require('@expo/config-plugins');

// Kakao SDK Maven 저장소 추가 플러그인
const withKakaoMaven = (config) => {
  return withProjectBuildGradle(config, (config) => {
    const kakaoMavenUrl = "https://devrepo.kakao.com/nexus/content/groups/public/";
    const kakaoMavenLine = `maven { url '${kakaoMavenUrl}' }`;

    if (!config.modResults.contents.includes(kakaoMavenUrl)) {
      // allprojects { repositories { ... } } 블록 찾아서 추가
      const repositoriesRegex = /(allprojects\s*\{\s*repositories\s*\{)/;

      if (repositoriesRegex.test(config.modResults.contents)) {
        config.modResults.contents = config.modResults.contents.replace(
          repositoriesRegex,
          `$1\n    ${kakaoMavenLine}`
        );
      } else {
        // fallback: JitPack 블록 뒤에 추가
        const jitpackRegex = /maven\s*\{\s*url\s*['"]https:\/\/www\.jitpack\.io['"]\s*\}/;
        if (jitpackRegex.test(config.modResults.contents)) {
          config.modResults.contents = config.modResults.contents.replace(
            jitpackRegex,
            `maven { url 'https://www.jitpack.io' }\n    ${kakaoMavenLine}`
          );
        }
      }
    }

    return config;
  });
};

module.exports = withKakaoMaven;
