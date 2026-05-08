/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  eslint: {
    // ESLint will be run during build
    dirs: ['src', 'pages', 'app'],
  },
  env: {
    // Environment variables can be added here
  },
  // Image optimization
  images: {
    remotePatterns: [],
  },
};

module.exports = nextConfig;
