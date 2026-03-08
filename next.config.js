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
  // Normalize to one canonical host so https and www work without certificate mismatch.
  // Redirect www → non-www (canonical: https://tellacity.com). Fix NET::ERR_CERT_COMMON_NAME_INVALID
  // by ensuring your host issues a cert for both tellacity.com and www.tellacity.com (or use this redirect).
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.tellacity.com" }],
        destination: "https://tellacity.com/:path*",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
