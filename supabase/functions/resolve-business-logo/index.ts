/**
 * Resolve business logo URL by domain.
 * Primary use: category and business pages when businesses.logo_url is empty.
 * Uses Logo.dev API: https://img.logo.dev/{domain}?token=...
 *
 * Set LOGO_DEV_TOKEN in Supabase Edge Function secrets (Logo.dev publishable key).
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function normalizeDomain(input: string): string | null {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;
  try {
    const url = trimmed.startsWith("http") ? new URL(trimmed) : new URL(`https://${trimmed}`);
    const host = url.hostname.replace(/^www\./, "");
    return host || null;
  } catch {
    return trimmed.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] || null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const domain = typeof body?.domain === "string" ? body.domain : null;
    const normalized = domain ? normalizeDomain(domain) : null;

    if (!normalized) {
      return new Response(
        JSON.stringify({ error: "domain is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = Deno.env.get("LOGO_DEV_TOKEN") ?? "";
    if (!token) {
      return new Response(
        JSON.stringify({ error: "LOGO_DEV_TOKEN not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const logoUrl = `https://img.logo.dev/${encodeURIComponent(normalized)}?token=${encodeURIComponent(token)}&fallback=404`;

    return new Response(
      JSON.stringify({ url: logoUrl, logoUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (_err) {
    return new Response(
      JSON.stringify({ error: "Invalid request" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
