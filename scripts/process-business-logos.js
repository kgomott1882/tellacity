import "dotenv/config";
import { config as loadEnvLocal } from "dotenv";
loadEnvLocal({ path: ".env.local", override: true });

/**
 * Unified logo pipeline: migrate Logo.dev URLs → Supabase Storage, then backfill missing logos.
 * Safe to re-run: skips failed domains (logo_fetch_failed) and completed rows.
 */
import { createClient } from "@supabase/supabase-js";

console.log("LOGO TOKEN:", process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN);

process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

const BATCH_SIZE = parseInt(process.env.LOGO_BATCH_SIZE || "50", 10);
const BATCH_DELAY = parseInt(process.env.LOGO_BATCH_DELAY_MS || process.env.LOGO_DELAY_MS || "1500", 10);

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

async function markLogoFetchFailed(adminSupabase, businessId) {
  await adminSupabase
    .from("businesses")
    .update({ logo_fetch_failed: true })
    .eq("id", businessId);
  console.log("MARKED FAILED:", businessId);
}

async function uploadPngAndUpdateRow(adminSupabase, businessId, buffer, { mode }) {
  const filePath = `${businessId}/logo.png`;
  const { error: uploadError } = await adminSupabase.storage
    .from("business_logos")
    .upload(filePath, buffer, {
      upsert: true,
      contentType: "image/png",
    });
  if (uploadError) {
    console.error("UPLOAD FAILED:", businessId, uploadError);
    return false;
  }
  console.log("UPLOAD SUCCESS:", filePath);

  const { data: publicLogo } = adminSupabase.storage.from("business_logos").getPublicUrl(filePath);
  const storageUrl = publicLogo?.publicUrl ?? null;
  if (!storageUrl) {
    console.warn("PUBLIC URL missing:", businessId);
    return false;
  }
  console.log("[PUBLIC URL]", storageUrl);

  const patch = {
    logo_url: storageUrl,
    logo_fetched_at: new Date().toISOString(),
    logo_fetch_failed: false,
  };

  let q = adminSupabase.from("businesses").update(patch).eq("id", businessId);
  if (mode === "migrate") {
    q = q.like("logo_url", "https://img.logo.dev%");
  } else {
    q = q.is("logo_url", null);
  }

  const { error: updateError } = await q;
  if (updateError) {
    console.warn("DB update failed:", businessId, updateError.message);
    return false;
  }
  return true;
}

async function processOne(adminSupabase, business) {
  const id = String(business.id ?? "");
  const logoUrl = String(business.logo_url ?? "").trim();

  // CASE A — migrate existing Logo.dev URL
  if (logoUrl && logoUrl.includes("img.logo.dev")) {
    const logoRes = await fetch(logoUrl, { method: "GET" });
    if (logoRes.status === 429) {
      console.warn("RATE LIMITED:", logoUrl);
      await sleep(3000);
      return;
    }
    if (!logoRes.ok) {
      console.log("MIGRATE fetch failed:", id, logoRes.status);
      await markLogoFetchFailed(adminSupabase, id);
      return;
    }
    const buffer = new Uint8Array(await logoRes.arrayBuffer());
    const ok = await uploadPngAndUpdateRow(adminSupabase, id, buffer, { mode: "migrate" });
    if (ok) console.log("MIGRATED:", id);
    return;
  }

  // CASE B — backfill (no logo yet)
  if (!logoUrl) {
    const raw = business.website || "";

    let cleanDomain = raw;

    // 1. Extract URL from markdown if present
    const markdownMatch = cleanDomain.match(/\((https?:\/\/[^)]+)\)/);
    if (markdownMatch) {
      cleanDomain = markdownMatch[1];
    }

    // 2. Remove protocol
    cleanDomain = cleanDomain.replace(/^https?:\/\//, "");

    // 3. Remove www
    cleanDomain = cleanDomain.replace(/^www\./, "");

    // 4. Remove path
    cleanDomain = cleanDomain.split("/")[0];

    // 5. Final cleanup
    cleanDomain = cleanDomain.trim().toLowerCase();

    // Skip obvious junk domains
    const invalidPatterns = [
      "trashlify.com",
      "localhost",
      ".invalid",
      ".test",

      // AI / spam / tool domains
      "aiworthstudio.com",
      "lovable.app",
      "oastify.com",
      "assignmenthelp.com",
      "useaustralia.store",
      "rprcollaborator.net",

      // common junk patterns
      "temp",
      "test",
      "demo",
      "sample"
    ];

    // Additional heuristics
    const isWeirdSubdomain =
      cleanDomain.split(".")[0].length > 25; // very long random names

    if (
      !cleanDomain ||
      cleanDomain.length < 4 ||
      invalidPatterns.some(p => cleanDomain.includes(p)) ||
      isWeirdSubdomain
    ) {
      console.log("SKIP junk domain:", cleanDomain);
      await markLogoFetchFailed(adminSupabase, id);
      return;
    }

    // 6. Validate
    if (!cleanDomain || cleanDomain.includes("(") || cleanDomain.includes("[")) {
      console.log("SKIP invalid domain:", raw);
      await markLogoFetchFailed(adminSupabase, id);
      return;
    }

    console.log("CLEAN DOMAIN:", cleanDomain);

    const token = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN;
    if (!token) {
      console.error("❌ Missing NEXT_PUBLIC_LOGO_DEV_TOKEN");
      process.exit(1);
    }
    const fetchUrl = `https://img.logo.dev/${cleanDomain}?token=${token}&fallback=404`;
    const logoRes = await fetch(fetchUrl, { method: "GET" });

    if (logoRes.status === 404) {
      await markLogoFetchFailed(adminSupabase, id);
      console.log("FAILED DOMAIN:", id);
      return;
    }

    if (logoRes.status === 429) {
      console.warn("RATE LIMITED:", cleanDomain);
      await sleep(3000);
      return;
    }

    if (!logoRes.ok) {
      console.log("FETCH failed:", id, cleanDomain, logoRes.status);
      await markLogoFetchFailed(adminSupabase, id);
      return;
    }

    const buffer = new Uint8Array(await logoRes.arrayBuffer());
    const ok = await uploadPngAndUpdateRow(adminSupabase, id, buffer, { mode: "backfill" });
    if (ok) console.log("FETCHED:", id);
    return;
  }

  // CASE C — already has non–Logo.dev URL
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (!process.env.LOGO_DEV_TOKEN && !process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN) {
    console.warn(
      "[process:logos] LOGO_DEV_TOKEN not set — Logo.dev backfill may return 401; migration of existing img.logo.dev URLs still works."
    );
  }

  console.log(
    `[process:logos] start batch=${BATCH_SIZE} batchDelay=${BATCH_DELAY}ms`
  );

  while (true) {
    const { data, error } = await adminSupabase
      .from("businesses")
      .select("id,name,website,logo_url,logo_fetch_failed")
      .eq("logo_fetch_failed", false)
      .not("website", "is", null)
      .or("logo_url.is.null,logo_url.like.https://img.logo.dev%")
      .order("review_count", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(BATCH_SIZE);

    if (error) {
      console.error("[process:logos] batch query failed:", error.message);
      break;
    }

    const batch = data ?? [];
    if (batch.length === 0) break;

    for (const business of batch) {
      try {
        await processOne(adminSupabase, business);
      } catch (err) {
        console.error("FAILED:", business.id, err instanceof Error ? err.message : err);
        await markLogoFetchFailed(adminSupabase, business.id);
      }
      await sleep(200);
    }

    console.log("Processed batch:", batch.length);
    await sleep(BATCH_DELAY);
  }

  console.log("[process:logos] finished");
  process.exit(0);
}

main().catch((err) => {
  console.error("[process:logos] fatal:", err);
  process.exit(1);
});
