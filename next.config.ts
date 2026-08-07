import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // vnstock-js stays in node_modules at runtime instead of being bundled,
  // so its lazy-loaded data files resolve correctly on Vercel.
  serverExternalPackages: ["vnstock-js"],
  // Bảng giá and Biểu đồ used to be routes; they are workspace tabs now, so
  // old links land on the workspace with that tab open.
  async redirects() {
    return [
      { source: "/bang-gia", destination: "/?tab=bang-gia", permanent: false },
      { source: "/bieu-do", destination: "/?tab=bieu-do", permanent: false },
    ];
  },
};

export default nextConfig;
