/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: '.',
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js'],
  },
};

module.exports = nextConfig;
