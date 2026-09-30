import type { NextConfig } from "next";

// Alamat backend dari sisi server Next.js (bukan dari browser). Bawaan cocok untuk satu mesin.
const backendUrl = process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Foto yang diunggah disajikan backend di /uploads. Dengan rewrite ini foto dimuat dari
      // domain yang sama (https) tanpa perlu menambah aturan di nginx.
      { source: "/uploads/:path*", destination: `${backendUrl}/uploads/:path*` },
    ];
  },
};

export default nextConfig;
