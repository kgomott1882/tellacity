import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const { email, code } = await req.json();
    if (!email || !code) {
      return new Response(
        JSON.stringify({ error: "Email and code are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration missing." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: otpRow } = await supabase
      .from("email_otps")
      .select("id, expires_at, used")
      .eq("email", email)
      .eq("code", code)
      .eq("purpose", "signup")
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!otpRow) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired code." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await supabase.from("email_otps").update({ used: true }).eq("id", otpRow.id);

    const { data: userList, error: listError } =
      await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });

    if (listError) {
      return new Response(
        JSON.stringify({ error: "Unable to find user." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const matchingUser = userList.users.find((user) => user.email === email);

    if (!matchingUser?.id) {
      return new Response(
        JSON.stringify({ error: "User not found." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error: confirmError } = await supabase.auth.admin.updateUserById(
      matchingUser.id,
      { email_confirm: true }
    );

    if (confirmError) {
      return new Response(
        JSON.stringify({ error: confirmError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: linkData, error: linkError } =
      await supabase.auth.admin.generateLink({
        type: "magiclink",
        email,
      });

    if (linkError) {
      return new Response(
        JSON.stringify({ error: linkError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = linkData?.email_otp ?? linkData?.properties?.email_otp;
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unable to create session." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: sessionData, error: sessionError } =
      await supabase.auth.verifyOtp({
        email,
        token,
        type: "magiclink",
      });

    if (sessionError || !sessionData?.session) {
      return new Response(
        JSON.stringify({ error: sessionError?.message ?? "Session not created." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ session: sessionData.session, user: sessionData.user }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (_error) {
    return new Response(
      JSON.stringify({ error: "Invalid request." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
