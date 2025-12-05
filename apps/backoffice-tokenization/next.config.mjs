/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ["@trustless-work/ui"],

  turbopack: {
    root: "../../"
  }
};

export default nextConfig;
