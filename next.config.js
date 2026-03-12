/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    enabled: false,
  },
  async redirects() {
    return [
      {
        source: "/c/:slug",
        destination: "/categories/:slug",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
