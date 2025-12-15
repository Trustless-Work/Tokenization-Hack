import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  transpilePackages: ["@tokenization/shared", "@tokenization/ui"],
};

export default nextConfig;
