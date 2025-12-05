/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🔥 Forces Next.js to fall back to Webpack for both dev/build
  experimental: {
    turbo: false, // fully disable Turbopack
  },

  // Optional: Some crypto utilities still expect fallbacks
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      crypto: false,
      stream: false,
      assert: false,
    };
    return config;
  },
};

export default nextConfig;
