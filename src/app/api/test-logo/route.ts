export async function GET() {
  const token = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN;

  return Response.json({
    token_exists: Boolean(token),
    token_preview: token ? token.slice(0, 6) + "..." : null,
    sample_logo_url: token
      ? `https://img.logo.dev/shopify.com?token=${token}&fallback=404`
      : null
  });
}
