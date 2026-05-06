import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  reactStrictMode: true,
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
