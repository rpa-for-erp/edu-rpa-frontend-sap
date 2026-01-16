const config = {
  swcMinify: false,
  transpilePackages: ["monaco-editor", "bpmn-js", "diagram-js"],
  webpack: (config, { isServer }) => {
    config.optimization = config.optimization || {};
    config.optimization.minimize = false;
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    // Handle Monaco Editor for SSR
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }

    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // output: 'export',
  images: {
    unoptimized: true,
  },
};

const { i18n } = require('./next-i18next.config');

require("dotenv").config({ path: `./.env.${process.env.NODE_ENV}` });

module.exports = {
  ...config,
  i18n,
};
