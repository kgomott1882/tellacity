import { supabaseServer } from "@/lib/supabaseServer";
import { randomBytes } from "crypto";

const SEND_DELAY_DAYS = 7;

type ShopifyOrderRow = {
  id: string;
  shop_domain: string | null;
  order_id: string | null;
  order_number: string | null;
  customer_email: string | null;
  customer_name: string | null;
  total_price: string | null;
  currency: string | null;
  order_created_at: string | null;
  processed?: boolean | null;
};

type ShopifyIntegrationRow = {
  shop_domain: string;
  business_id: string | null;
};

/**
 * Process Shopify orders that do not yet have invites created:
 * - Resolve business_id from shopify_integrations by shop_domain
 * - Insert review_invites (send_at = now + 7 days)
 * - Mark shopify_orders as processed
 */
export async function processShopifyOrders(): Promise<{
  processed: number;
  errors: string[];
}> {
  const errors: string[] = [];

  const { data: orders, error: ordersError } = await supabaseServer
    .from("shopify_orders")
    .select("id, shop_domain, order_id, order_number, customer_email, customer_name, total_price, currency, order_created_at")
    .or("processed.is.null,processed.eq.false");

  if (ordersError) {
    errors.push(`Failed to fetch shopify_orders: ${ordersError.message}`);
    return { processed: 0, errors };
  }

  const rows = (orders ?? []) as ShopifyOrderRow[];
  let processed = 0;

  for (const order of rows) {
    const shopDomain = order.shop_domain ?? "";
    if (!shopDomain) {
      errors.push(`Order ${order.id} has no shop_domain`);
      continue;
    }

    const { data: integration, error: intError } = await supabaseServer
      .from("shopify_integrations")
      .select("business_id")
      .eq("shop_domain", shopDomain)
      .maybeSingle();

    if (intError) {
      errors.push(`Integration lookup failed for ${shopDomain}: ${intError.message}`);
      continue;
    }

    const integrationRow = integration as ShopifyIntegrationRow | null;
    const businessId = integrationRow?.business_id ?? null;

    if (!businessId) {
      errors.push(`No business_id for shop_domain ${shopDomain} (order ${order.id})`);
      continue;
    }

    const customerEmail = order.customer_email?.trim() || null;
    if (!customerEmail) {
      errors.push(`Order ${order.id} has no customer_email`);
      continue;
    }

    const sendAt = new Date();
    sendAt.setUTCDate(sendAt.getUTCDate() + SEND_DELAY_DAYS);

    const token = randomBytes(32).toString("hex");

    const { error: insertError } = await supabaseServer
      .from("review_invites")
      .insert({
        business_id: businessId,
        recipient_email: customerEmail,
        channel: "email",
        source: "shopify",
        shopify_order_id: order.order_id ?? null,
        send_at: sendAt.toISOString(),
        token,
        status: "scheduled",
      });

    if (insertError) {
      errors.push(`Insert invite for order ${order.id}: ${insertError.message}`);
      continue;
    }

    const { error: updateError } = await supabaseServer
      .from("shopify_orders")
      .update({ processed: true })
      .eq("id", order.id);

    if (updateError) {
      errors.push(`Mark processed for order ${order.id}: ${updateError.message}`);
      continue;
    }

    processed += 1;
  }

  return { processed, errors };
}
