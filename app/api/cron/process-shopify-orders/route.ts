import { NextResponse } from "next/server";
import { processShopifyOrders } from "@/jobs/processShopifyOrders";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const cronSecret = request.headers.get("x-cron-secret");
  if (cronSecret !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { processed, errors } = await processShopifyOrders();

  return NextResponse.json({
    processed,
    errors,
  });
}
