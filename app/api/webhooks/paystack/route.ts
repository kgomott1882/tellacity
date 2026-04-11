import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  syncBusinessPlanColumn,
  upsertActiveSubscriptionForBusiness,
} from "@/lib/subscriptionWrite";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const event = body.event;
    const reference = body.data?.reference;

    // 🔹 Store raw webhook (always)
    await supabase.from("paystack_webhook_events").insert({
      event,
      reference,
      payload: body,
    });

    // 🔹 Only handle successful payments
    if (event !== "charge.success") {
      return NextResponse.json({ received: true });
    }

    const metadata = body.data?.metadata;

    const businessId = metadata?.business_id;
    const planCode = metadata?.plan_code;

    if (!businessId || !planCode) {
      console.error("Missing metadata", metadata);
      return NextResponse.json({ error: "Invalid metadata" }, { status: 400 });
    }

    const bid = String(businessId);
    const pcode = String(planCode);

    const paystackSubKey =
      typeof reference === "string" && reference.trim() !== ""
        ? reference.trim()
        : undefined;

    const sub = await upsertActiveSubscriptionForBusiness(supabase, {
      businessId: bid,
      planCode: pcode,
      provider: "paystack",
      providerSubId: paystackSubKey,
    });
    if (!sub.ok) {
      console.error("Subscription upsert error:", sub.error);
      return NextResponse.json({ error: "DB update failed" }, { status: 500 });
    }

    await syncBusinessPlanColumn(supabase, bid, pcode);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Paystack webhook error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
