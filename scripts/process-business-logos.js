import "dotenv/config";
import { config as loadEnvLocal } from "dotenv";
loadEnvLocal({ path: ".env.local", override: true });

/**
 * Unified logo pipeline: migrate Logo.dev URLs → Supabase Storage, then backfill missing logos.
 * Safe to re-run: processes rows with null/logo.dev URLs.
 * Skips logo_fetch_failed rows unless LOGO_RETRY_FAILED=1.
 */
import { createClient } from "@supabase/supabase-js";

console.log("LOGO TOKEN:", process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN);

process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

const BATCH_SIZE = parseInt(process.env.LOGO_BATCH_SIZE || "50", 10);
const BATCH_DELAY = parseInt(process.env.LOGO_BATCH_DELAY_MS || process.env.LOGO_DELAY_MS || "1500", 10);
const FETCH_TIMEOUT_MS = parseInt(process.env.LOGO_FETCH_TIMEOUT_MS || "12000", 10);
const RETRY_FAILED = process.env.LOGO_RETRY_FAILED === "1" || process.env.LOGO_RETRY_FAILED === "true";

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

async function safeFetch(url, label) {
  try {
    const res = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { "User-Agent": "TellacityLogoBot/1.0" },
    });
    return res;
  } catch (err) {
    const reason =
      err instanceof Error
        ? err.cause?.code || err.cause?.message || err.message
        : String(err);
    console.log(`FETCH SKIP (${label}):`, reason);
    return null;
  }
}

async function tryFetchAndUpload(adminSupabase, businessId, url, label, mode) {
  const res = await safeFetch(url, label);
  if (!res?.ok) {
    if (res) console.log(`${label} HTTP ${res.status}`);
    return false;
  }
  const buffer = new Uint8Array(await res.arrayBuffer());
  if (buffer.length < 32) {
    console.log(`${label} empty/tiny (${buffer.length} bytes)`);
    return false;
  }
  const contentType =
    res.headers.get("content-type")?.split(";")[0]?.trim() || "image/png";
  const ok = await uploadPngAndUpdateRow(adminSupabase, businessId, buffer, {
    mode,
    contentType,
  });
  if (ok) console.log(label, businessId);
  return ok;
}

async function tryGoogleThenSiteFavicons(adminSupabase, businessId, cleanDomain, mode) {
  const googleUrl = `https://www.google.com/s2/favicons?sz=256&domain=${encodeURIComponent(cleanDomain)}`;
  if (await tryFetchAndUpload(adminSupabase, businessId, googleUrl, "FALLBACK GOOGLE", mode)) {
    return true;
  }

  const ddgUrl = `https://icons.duckduckgo.com/ip3/${encodeURIComponent(cleanDomain)}.ico`;
  if (await tryFetchAndUpload(adminSupabase, businessId, ddgUrl, "FALLBACK DUCKDUCKGO", mode)) {
    return true;
  }

  const siteUrl = `https://${cleanDomain}/favicon.ico`;
  if (await tryFetchAndUpload(adminSupabase, businessId, siteUrl, "FALLBACK SITE", mode)) {
    return true;
  }

  return false;
}

async function markLogoFetchFailed(adminSupabase, businessId) {
  const { data: rpcOk, error: rpcError } = await adminSupabase.rpc(
    "set_business_logo_from_service",
    {
      p_business_id: businessId,
      p_logo_url: null,
      p_logo_fetch_failed: true,
    },
  );

  if (!rpcError && rpcOk === true) {
    console.log("MARKED FAILED:", businessId);
    return;
  }

  const { error: updateError } = await adminSupabase
    .from("businesses")
    .update({ logo_fetch_failed: true })
    .eq("id", businessId);

  if (updateError) {
    console.warn("MARK FAILED update error:", businessId, updateError.message);
  } else {
    console.log("MARKED FAILED:", businessId);
  }
}

async function uploadPngAndUpdateRow(
  adminSupabase,
  businessId,
  buffer,
  { mode, contentType = "image/png" }
) {
  const filePath = `${businessId}/logo.png`;
  const { error: uploadError } = await adminSupabase.storage
    .from("business_logos")
    .upload(filePath, buffer, {
      upsert: true,
      contentType,
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

  const { data: rpcOk, error: rpcError } = await adminSupabase.rpc(
    "set_business_logo_from_service",
    {
      p_business_id: businessId,
      p_logo_url: patch.logo_url,
      p_logo_fetched_at: patch.logo_fetched_at,
      p_logo_fetch_failed: patch.logo_fetch_failed,
    },
  );

  if (!rpcError && rpcOk === true) {
    return true;
  }

  if (rpcError) {
    const msg = rpcError.message ?? "";
    if (msg.includes("set_business_logo_from_service")) {
      console.warn(
        "RPC set_business_logo_from_service missing — apply migration 20260523120000_set_business_logo_service.sql",
      );
    } else {
      console.warn("RPC logo update failed:", businessId, msg);
    }
  }

  // Fallback: direct update (may fail on hosted DB with users-table triggers).
  const { error: updateError } = await adminSupabase
    .from("businesses")
    .update(patch)
    .eq("id", businessId);

  if (updateError) {
    console.warn("DB update failed:", businessId, updateError.message);
    console.warn(
      "Logo uploaded to storage but businesses.logo_url was not linked:",
      storageUrl,
    );
    return false;
  }
  return true;
}

/** Domain segment from e.g. https://img.logo.dev/example.com?token=… */
function cleanDomainFromLogoDevUrl(logoUrl) {
  try {
    const u = new URL(logoUrl);
    const part = u.pathname.replace(/^\//, "").split("/")[0];
    if (!part) return null;
    return part.split("?")[0].trim().toLowerCase();
  } catch {
    return null;
  }
}

async function processOne(adminSupabase, business) {
  const id = String(business.id ?? "");
  const logoUrl = String(business.logo_url ?? "").trim();

  // CASE A , migrate existing Logo.dev URL
  if (logoUrl && logoUrl.includes("img.logo.dev")) {
    const migrateDomain = cleanDomainFromLogoDevUrl(logoUrl);
    if (!migrateDomain) {
      await markLogoFetchFailed(adminSupabase, id);
      return false;
    }

    /* TEMP disabled: Logo.dev primary fetch (rate limits) , restore when re-enabling
    const logoRes = await fetch(logoUrl, { method: "GET" });
    if (logoRes.status === 429) {
      console.warn("RATE LIMITED:", logoUrl);
    }
    if (logoRes.status === 200) {
      const buffer = new Uint8Array(await logoRes.arrayBuffer());
      if (buffer.length > 0) {
        const ok = await uploadPngAndUpdateRow(adminSupabase, id, buffer, { mode: "migrate" });
        if (ok) {
          console.log("MIGRATED:", id);
          return;
        }
      }
    } else if (logoRes.status !== 429) {
      console.log("MIGRATE fetch failed:", id, logoRes.status);
    }
    */

    console.log("SKIP LOGO.DEV (migrate):", migrateDomain);
    const got = await tryGoogleThenSiteFavicons(adminSupabase, id, migrateDomain, "migrate");
    if (got) return true;

    await markLogoFetchFailed(adminSupabase, id);
    return false;
  }

  // CASE B , backfill (no logo yet)
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
      return false;
    }

    // 6. Validate
    if (!cleanDomain || cleanDomain.includes("(") || cleanDomain.includes("[")) {
      console.log("SKIP invalid domain:", raw);
      await markLogoFetchFailed(adminSupabase, id);
      return false;
    }

    console.log("CLEAN DOMAIN:", cleanDomain);

    /* TEMP disabled: Logo.dev backfill (rate limits) , restore when re-enabling
    const token = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN;
    if (!token) {
      console.error("❌ Missing NEXT_PUBLIC_LOGO_DEV_TOKEN");
      process.exit(1);
    }
    const fetchUrl = `https://img.logo.dev/${cleanDomain}?token=${token}&fallback=404`;
    const logoRes = await fetch(fetchUrl, { method: "GET" });

    if (logoRes.status === 429) {
      console.warn("RATE LIMITED:", cleanDomain);
    }

    if (logoRes.status === 200) {
      const buffer = new Uint8Array(await logoRes.arrayBuffer());
      if (buffer.length > 0) {
        const ok = await uploadPngAndUpdateRow(adminSupabase, id, buffer, { mode: "backfill" });
        if (ok) {
          console.log("FETCHED:", id);
          return;
        }
      }
    } else if (logoRes.status !== 429) {
      console.log("Logo.dev not OK:", id, cleanDomain, logoRes.status);
    }

    const gotFallback = await tryGoogleThenSiteFavicons(
      adminSupabase,
      id,
      cleanDomain,
      "backfill"
    );
    if (gotFallback) return;
    */

    // Skip Logo.dev due to rate limits
    console.log("SKIP LOGO.DEV:", cleanDomain);

    const gotFallback = await tryGoogleThenSiteFavicons(
      adminSupabase,
      id,
      cleanDomain,
      "backfill"
    );
    if (gotFallback) return true;

    await markLogoFetchFailed(adminSupabase, id);
    console.log("FINAL FAILED:", id);
    return false;
  }

  // CASE C , already has non–Logo.dev URL
  return false;
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
      "[process:logos] Logo.dev token not set , primary Logo.dev path is disabled; using Google/site favicon fallbacks only."
    );
  }

  console.log(
    `[process:logos] start batch=${BATCH_SIZE} batchDelay=${BATCH_DELAY}ms retryFailed=${RETRY_FAILED}`
  );

  let totalOk = 0;
  let totalFail = 0;

  while (true) {
    let query = adminSupabase
      .from("businesses")
      .select("id,name,website,logo_url,logo_fetch_failed")
      .not("website", "is", null)
      .or("logo_url.is.null,logo_url.like.https://img.logo.dev%");

    if (!RETRY_FAILED) {
      query = query.eq("logo_fetch_failed", false);
    }

    const { data, error } = await query
      .order("review_count", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(BATCH_SIZE);

    if (error) {
      console.error("[process:logos] batch query failed:", error.message);
      break;
    }

    const batch = data ?? [];
    if (batch.length === 0) break;

    let batchOk = 0;
    let batchFail = 0;

    for (const business of batch) {
      try {
        const ok = await processOne(adminSupabase, business);
        if (ok) batchOk++;
        else batchFail++;
      } catch (err) {
        console.error("FAILED:", business.id, err instanceof Error ? err.message : err);
        await markLogoFetchFailed(adminSupabase, business.id);
        batchFail++;
      }
      await sleep(200);
    }

    totalOk += batchOk;
    totalFail += batchFail;
    console.log(`Processed batch: ${batch.length} (ok=${batchOk} fail=${batchFail})`);
    await sleep(BATCH_DELAY);
  }

  console.log(`[process:logos] finished ok=${totalOk} fail=${totalFail}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[process:logos] fatal:", err);
  process.exit(1);
});
