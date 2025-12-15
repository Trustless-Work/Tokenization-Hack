import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  transpilePackages: ["@tokenization/shared", "@tokenization/ui"],
  turbopack: {
    // Point Turbopack to the monorepo root to avoid incorrect root inference
    root: "../../",
  },
};

export default nextConfig;
