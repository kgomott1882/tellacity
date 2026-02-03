/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: true,
  },
  images: {
    domains: [
      "logo.dev",
      "img.logo.dev",
      "res.cloudinary.com",
      "lh3.googleusercontent.com",
      "avatars.githubusercontent.com"
    ],
  },
};

module.exports = nextConfig;

