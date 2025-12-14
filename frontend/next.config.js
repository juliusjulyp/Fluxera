/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required headers for @linera/client WASM module
  // These enable SharedArrayBuffer which is needed for the WebAssembly runtime
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "credentialless",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "cross-origin",
          },
        ],
      },
    ];
  },

  // @linera/client is a browser-only WASM package
  // It's loaded dynamically via our linera-loader.ts, not at build time

  // Webpack configuration for WASM support
  webpack: (config, { isServer }) => {
    // Enable WebAssembly experiments
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
      topLevelAwait: true,
    };

    // Fallback for node modules not available in browser
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };

    return config;
  },

  // Transpile the linera client package
  transpilePackages: ['@linera/client'],

  // Ignore TypeScript build errors (for faster iteration)
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
