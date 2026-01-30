const { withProjectBuildGradle } = require('@expo/config-plugins');

// Kakao SDK Maven 저장소 추가 플러그인
const withKakaoMaven = (config) => {
  return withProjectBuildGradle(config, (config) => {
    const kakaoMavenUrl = "https://devrepo.kakao.com/nexus/content/groups/public/";

    if (!config.modResults.contents.includes(kakaoMavenUrl)) {
      config.modResults.contents = config.modResults.contents.replace(
        /maven\s*\{\s*url\s*['"]https:\/\/www\.jitpack\.io['"]\s*\}/,
        `maven { url 'https://www.jitpack.io' }\n    maven { url '${kakaoMavenUrl}' }`
      );
    }

    return config;
  });
};

module.exports = withKakaoMaven;
