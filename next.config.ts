import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // vnstock-js stays in node_modules at runtime instead of being bundled,
  // so its lazy-loaded data files resolve correctly on Vercel.
  serverExternalPackages: ["vnstock-js"],
  // The stock page moved from /stock/:symbol to /ma/:symbol; old links follow.
  async redirects() {
    return [{ source: "/stock/:symbol", destination: "/ma/:symbol", permanent: true }];
  },
};

export default nextConfig;
