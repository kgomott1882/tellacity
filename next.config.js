/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  // Canonical host: https://tellacity.com. Redirect www → non-www only (one hop).
  // Use temporary redirect (302) to avoid caching loops. If your host redirects
  // tellacity.com → www, disable that so only this redirect runs (or do www→apex at the host only).
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.tellacity.com" }],
        destination: "https://tellacity.com/:path*",
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
