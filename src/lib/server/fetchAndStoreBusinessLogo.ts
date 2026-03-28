import { createClient } from "@supabase/supabase-js";

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

/**
 * Backend utility only.
 * Fetches a business logo from Logo.dev one time and persists it in businesses.logo_url.
 */
export async function fetchAndStoreBusinessLogo(
  businessId: string,
  website: string
): Promise<void> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      console.warn("[fetchAndStoreBusinessLogo] Missing Supabase service role env vars.");
      return;
    }

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: current, error: readError } = await adminSupabase
      .from("businesses")
      .select("logo_url, logo_fetch_failed")
      .eq("id", businessId)
      .maybeSingle();

    if (readError) {
      console.warn("[fetchAndStoreBusinessLogo] Failed reading business:", readError.message);
      return;
    }

    // Already has a stored logo -> stop.
    if (String(current?.logo_url ?? "").trim()) {
      return;
    }
    if (current?.logo_fetch_failed === true) {
      return;
    }

    const domain = normalizeDomain(website);
    if (!domain) {
      console.warn("[fetchAndStoreBusinessLogo] Invalid website/domain for business:", businessId);
      return;
    }

    const logoDevToken = process.env.LOGO_DEV_TOKEN ?? process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN;
    if (!logoDevToken) {
      console.warn("[fetchAndStoreBusinessLogo] Missing LOGO_DEV_TOKEN.");
      return;
    }

    const logoDevUrl = `https://img.logo.dev/${encodeURIComponent(domain)}?token=${encodeURIComponent(
      logoDevToken
    )}&fallback=404`;

    // Single request only; no retries to avoid endless retry loops.
    const response = await fetch(logoDevUrl, { method: "GET" });
    if (!response.ok) {
      if (response.status === 404) {
        const { error: markFailedError } = await adminSupabase
          .from("businesses")
          .update({ logo_fetch_failed: true })
          .eq("id", businessId);
        if (markFailedError) {
          console.warn(
            "[fetchAndStoreBusinessLogo] Failed marking logo_fetch_failed:",
            markFailedError.message
          );
        }
      }
      console.warn(
        `[fetchAndStoreBusinessLogo] Logo.dev request failed for ${domain}: ${response.status}`
      );
      return;
    }

    const arrayBuffer = await response.arrayBuffer();
    const fileBytes = new Uint8Array(arrayBuffer);
    const filePath = `${businessId}/logo.png`;
    const contentType = response.headers.get("content-type") || "image/png";

    const { error: uploadError } = await adminSupabase.storage
      .from("business_logos")
      .upload(filePath, fileBytes, {
        contentType,
        upsert: true,
      });
    if (uploadError) {
      console.warn("[fetchAndStoreBusinessLogo] Failed uploading logo to storage:", uploadError.message);
      return;
    }

    const { data: publicLogo } = adminSupabase.storage
      .from("business_logos")
      .getPublicUrl(filePath);
    const storageLogoUrl = publicLogo?.publicUrl ?? null;
    if (!storageLogoUrl) {
      console.warn("[fetchAndStoreBusinessLogo] Failed getting public logo URL from storage.");
      return;
    }

    const { error: updateError } = await adminSupabase
      .from("businesses")
      .update({
        logo_url: storageLogoUrl,
        logo_fetched_at: new Date().toISOString(),
        logo_fetch_failed: false,
      })
      .eq("id", businessId);

    if (updateError) {
      console.warn("[fetchAndStoreBusinessLogo] Failed updating business logo:", updateError.message);
    }
  } catch (error) {
    console.warn("[fetchAndStoreBusinessLogo] Unexpected error:", error);
  }
}
