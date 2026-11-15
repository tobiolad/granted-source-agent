/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    dirs: ["app", "components", "lib", "prisma", "eval", "tests"]
  }
};

module.exports = nextConfig;
