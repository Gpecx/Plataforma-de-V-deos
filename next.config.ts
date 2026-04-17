import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  typedRoutes: true,
  // Evita que o bundler do Next.js tente empacotar o firebase-admin,
  // que usa módulos nativos (gRPC, protobuf) incompatíveis com o bundle do Edge/Node.
  serverExternalPackages: ['firebase-admin'],
};

export default nextConfig;
