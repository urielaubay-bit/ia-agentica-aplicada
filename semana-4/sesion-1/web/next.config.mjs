/** @type {import('next').NextConfig} */
const nextConfig = {
  // @xenova/transformers (y su runtime onnxruntime-node / sharp) traen binarios
  // nativos que webpack no debe empaquetar: se cargan con require() en tiempo de
  // ejecucion desde node_modules. Como el RAG se importa desde ../rag.ts (fuera
  // de esta app), la externalizacion automatica de Next no lo cubre, asi que la
  // declaramos a mano en el bundle del servidor.
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...(config.externals || []),
        "@xenova/transformers",
        "onnxruntime-node",
        "sharp",
      ];
    }
    return config;
  },
};
export default nextConfig;
