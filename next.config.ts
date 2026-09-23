import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfkit", "mammoth", "pdf-parse", "bcryptjs"],
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
    middlewareClientMaxBodySize: "20mb",
  },
};

export default nextConfig;
