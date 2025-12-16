import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  transpilePackages: [
    "@tokenization/shared",
    "@tokenization/ui",
    "@tokenization/tw-blocks-shared",
  ],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,POST,PUT,PATCH,DELETE,OPTIONS",
          },
          { key: "Access-Control-Allow-Headers", value: "*" },
          { key: "Access-Control-Max-Age", value: "86400" },
        ],
      },
    ];
  },
};

export default nextConfig;
