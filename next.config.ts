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
      { protocol: 'https', hostname: 'sandbox.asaas.com' },
      { protocol: 'https', hostname: 'www.asaas.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: '*.googleusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.gstatic.com; connect-src 'self' *.googleapis.com *.firebaseapp.com *.mux.com *.asaas.com https://inferred.litix.io; frame-src 'self' *.mux.com *.asaas.com; img-src 'self' data: blob: *.mux.com *.googleusercontent.com *.asaas.com *.googleapis.com images.unsplash.com; style-src 'self' 'unsafe-inline'; font-src 'self' data:; media-src 'self' blob: *.mux.com; worker-src 'self' blob:; object-src 'none'; base-uri 'self';",
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
