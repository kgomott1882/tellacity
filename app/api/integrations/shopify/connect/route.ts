import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("business_id");

  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const redirectUri =
    `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/shopify/callback?business_id=${businessId}`;

  const scope = "read_orders,read_customers";

  const authUrl =
    `https://accounts.shopify.com/oauth/authorize` +
    `?client_id=${clientId}` +
    `&scope=${scope}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code`;

  return NextResponse.redirect(authUrl);
}
