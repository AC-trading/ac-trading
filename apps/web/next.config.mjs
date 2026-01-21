/** @type {import('next').NextConfig} */

// 환경 변수에서 허용된 이미지 호스트 목록 가져오기
// 예: ALLOWED_IMAGE_HOSTS="cdn.example.com,images.example.com,*.cloudflare.com"
const allowedImageHosts = process.env.ALLOWED_IMAGE_HOSTS;

// 허용된 호스트를 remotePatterns 형식으로 변환
const getRemotePatterns = () => {
  if (!allowedImageHosts || allowedImageHosts.trim() === "") {
    // 환경 변수가 설정되지 않은 경우 빈 배열 반환 (로컬 이미지만 허용)
    console.warn(
      "ALLOWED_IMAGE_HOSTS 환경 변수가 설정되지 않았습니다. 외부 이미지가 차단됩니다."
    );
    return [];
  }

  return allowedImageHosts
    .split(",")
    .map((host) => host.trim())
    .filter((host) => host.length > 0)
    .map((hostname) => ({
      protocol: "https",
      hostname,
    }));
};

const nextConfig = {
  images: {
    remotePatterns: getRemotePatterns(),
  },
};

export default nextConfig;
