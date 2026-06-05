import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root so Turbopack doesn't pick up an unrelated lockfile
  // higher up the filesystem (e.g. a stray package-lock.json in the home dir).
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
