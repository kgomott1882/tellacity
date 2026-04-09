/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  async redirects() {
    return [
      // AUTH / PRIVATE (block from index)
      {
        source: "/login",
        destination: "/",
        permanent: true,
      },
      {
        source: "/business/verify/claim",
        destination: "/",
        permanent: true,
      },

      // HELP (legacy)
      {
        source: "/help/:path*",
        destination: "/",
        permanent: true,
      },

      // OLD CATEGORY STRUCTURE
      {
        source: "/c/:slug",
        destination: "/categories/:slug",
        permanent: true,
      },
      {
        source: "/best/:slug",
        destination: "/categories/:slug",
        permanent: true,
      },

      // BLOG / RESOURCES
      {
        source: "/resources/blog",
        destination: "/blog",
        permanent: true,
      },

      // BUSINESS FEATURES (if removed)
      {
        source: "/business/features",
        destination: "/",
        permanent: true,
      },

      // COUNTRY PAGE
      {
        source: "/za",
        destination: "/",
        permanent: true,
      },

      // Business dashboard root: avoid a redirect-only page (fixes Performance API
      // "negative time stamp" overlay when measuring the old default export name).
      {
        source: "/business/dashboard",
        destination: "/business/dashboard/analytics/performance",
        permanent: false,
      },

      // Removed Invite Settings (customer review invite tuning)
      {
        source: "/business/dashboard/settings/invite-settings",
        destination: "/business/dashboard/get-reviews/overview",
        permanent: true,
      },
      {
        source: "/business/dashboard/settings/invitations/:path*",
        destination: "/business/dashboard/get-reviews/overview",
        permanent: true,
      },

      // GARBAGE ROUTES
      {
        source: "/&",
        destination: "/",
        permanent: true,
      },
      {
        source: "/S",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
