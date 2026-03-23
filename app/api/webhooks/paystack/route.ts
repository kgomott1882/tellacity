import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

    // 🔹 Update subscription
    const { error } = await supabase
      .from("subscriptions")
      .update({
        plan_code: planCode,
        status: "active",
        provider: "paystack",
        updated_at: new Date().toISOString(),
      })
      .eq("business_id", businessId);

    if (error) {
      console.error("Subscription update error:", error);
      return NextResponse.json({ error: "DB update failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Paystack webhook error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
