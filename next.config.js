const nextConfig = {
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
      {
        source: "/business/forgot-password",
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
}

export default nextConfig
