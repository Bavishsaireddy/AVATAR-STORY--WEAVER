import type { NextConfig } from "next";


const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@prisma/client",
    "prisma",
    "@xenova/transformers",
    "onnxruntime-node",
    "sharp",
  ],
  experimental: {
    cpus: 1,
  },
  distDir: ".next.nosync",
};

export default nextConfig;
