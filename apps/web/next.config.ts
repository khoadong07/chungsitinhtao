import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  webpack(config, { dev }) {
    if (dev) {
      // Default eval-source-map uses eval() which some browser extensions block via CSP.
      // cheap-module-source-map gives the same line-level accuracy without eval().
      config.devtool = 'cheap-module-source-map';
    }
    return config;
  },
};

export default nextConfig;
