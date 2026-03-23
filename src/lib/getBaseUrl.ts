export function getBaseUrl() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // fallback for server
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  return "http://localhost:3000";
}
