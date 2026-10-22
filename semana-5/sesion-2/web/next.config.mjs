/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Habilita instrumentation.ts, que es donde se registra OpenTelemetry para
    // Langfuse. En Next.js 15+ esto ya es estable y la bandera no hace falta.
    instrumentationHook: true,
  },
};
export default nextConfig;
