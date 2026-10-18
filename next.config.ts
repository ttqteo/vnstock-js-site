import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // vnstock-js stays in node_modules at runtime instead of being bundled,
  // so its lazy-loaded data files resolve correctly on Vercel.
  serverExternalPackages: ["vnstock-js"],
  // Old links follow: /stock/:symbol moved to /ma/:symbol, and the single-page
  // era's /?tab=bang-gia and /?tab=bieu-do became their own routes. These live
  // here, not in the page, because app/loading.tsx makes a page redirect() a
  // streamed 200 instead of a real 307/308.
  async redirects() {
    return [
      { source: "/stock/:symbol", destination: "/ma/:symbol", permanent: true },
      { source: "/", has: [{ type: "query", key: "tab", value: "bang-gia" }], destination: "/bang-gia", permanent: true },
      { source: "/", has: [{ type: "query", key: "tab", value: "bieu-do" }], destination: "/bieu-do", permanent: true },
    ];
  },
};

export default nextConfig;
