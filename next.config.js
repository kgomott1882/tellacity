/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    enabled: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "imstyzwydypcmzwupmzu.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
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
