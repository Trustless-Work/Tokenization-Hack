import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  transpilePackages: ["@tokenization/shared", "@tokenization/ui", "@tokenization/tw-blocks-shared"],
};

export default nextConfig;
