import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  transpilePackages: ["@tokenization/shared", "@tokenization/ui", "@tokenization/tw-blocks-shared"],
  turbopack: {
    // Point Turbopack to the monorepo root to avoid incorrect root inference
    root: "../../",
  },
};

export default nextConfig;
