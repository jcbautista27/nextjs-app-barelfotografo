import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Detección de conectividad + retry automático + hook useOffline
    // (Next 16.3+, ver docs 01-app/03-api-reference/…/useOffline).
    useOffline: true,
  },
};

export default nextConfig;