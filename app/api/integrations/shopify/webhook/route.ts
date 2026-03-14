import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";

type ShopifyOrderPayload = {
  id?: number | string;
  order_number?: number | string;
  email?: string | null;
  customer?: {
    first_name?: string | null;
    last_name?: string | null;
  } | null;
  total_price?: string | number | null;
  currency?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
};

export async function POST(request: Request) {
  const shopDomain = request.headers.get("X-Shopify-Shop-Domain") ?? "";
  const topic = request.headers.get("X-Shopify-Topic") ?? "";

  let payload: unknown = null;
  try {
    payload = await request.json();
  } catch {
    payload = null;
  }

  const payloadJson =
    typeof payload === "object" && payload !== null
      ? JSON.stringify(payload)
      : String(payload ?? "");

  await supabaseServer.from("shopify_webhook_events").insert({
    shop_domain: shopDomain || null,
    topic: topic || null,
    payload: payloadJson,
  });

  if (topic === "orders/fulfilled" && typeof payload === "object" && payload !== null) {
    const order = payload as ShopifyOrderPayload;
    const customer = order.customer;
    const firstName = customer?.first_name ?? "";
    const lastName = customer?.last_name ?? "";
    const customerName = [firstName, lastName].filter(Boolean).join(" ").trim() || null;

    await supabaseServer.from("shopify_orders").insert({
      shop_domain: shopDomain || null,
      order_id: order.id != null ? String(order.id) : null,
      order_number: order.order_number != null ? String(order.order_number) : null,
      customer_email: order.email ?? null,
      customer_name: customerName,
      total_price: order.total_price != null ? String(order.total_price) : null,
      currency: order.currency ?? null,
      order_created_at: order.created_at ?? null,
    });
  }

  return new NextResponse(null, { status: 200 });
}
