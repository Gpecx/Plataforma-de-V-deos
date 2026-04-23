import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  typedRoutes: true,
  // Evita que o bundler do Next.js tente empacotar o firebase-admin,
  // que usa módulos nativos (gRPC, protobuf) incompatíveis com o bundle do Edge/Node.
  serverExternalPackages: ['firebase-admin'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sandbox.asaas.com',
      },
      {
        protocol: 'https',
        hostname: 'www.asaas.com',
      }
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "img-src 'self' data: blob: https://sandbox.asaas.com https://www.asaas.com https://firebasestorage.googleapis.com https://*.googleusercontent.com https://images.unsplash.com *;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
