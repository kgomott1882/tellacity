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

      // BLOG → ARTICLES (content hub consolidation)
      {
        source: "/resources/blog",
        destination: "/articles",
        permanent: true,
      },
      {
        source: "/blog",
        destination: "/articles",
        permanent: true,
      },
      {
        source: "/blog/:slug",
        destination: "/articles/:slug",
        permanent: true,
      },

      // BUSINESS FEATURES (if removed)
      {
        source: "/business/features",
        destination: "/",
        permanent: true,
      },

      // Reputation platform merged into for-business
      {
        source: "/reputation-platform",
        destination: "/for-business",
        permanent: true,
      },

      // COUNTRY PAGE
      {
        source: "/za",
        destination: "/",
        permanent: true,
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
