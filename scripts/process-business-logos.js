import "dotenv/config";
import { config as loadEnvLocal } from "dotenv";
loadEnvLocal({ path: ".env.local", override: true });

/**
 * Unified logo pipeline: migrate Logo.dev URLs → Supabase Storage, then backfill missing logos.
 * Safe to re-run: retries rows with null/logo.dev URLs (including logo_fetch_failed).
 */
import { createClient } from "@supabase/supabase-js";

console.log("LOGO TOKEN:", process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN);

process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

const BATCH_SIZE = parseInt(process.env.LOGO_BATCH_SIZE || "50", 10);
const BATCH_DELAY = parseInt(process.env.LOGO_BATCH_DELAY_MS || process.env.LOGO_DELAY_MS || "1500", 10);

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

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

async function tryGoogleThenSiteFavicons(adminSupabase, businessId, cleanDomain, mode) {
  const fallback1 = `https://www.google.com/s2/favicons?sz=256&domain=${encodeURIComponent(cleanDomain)}`;
  const res1 = await fetch(fallback1, { method: "GET" });
  if (res1.ok) {
    const buf1 = new Uint8Array(await res1.arrayBuffer());
    if (buf1.length > 0) {
      const ct1 =
        res1.headers.get("content-type")?.split(";")[0]?.trim() || "image/png";
      const ok1 = await uploadPngAndUpdateRow(adminSupabase, businessId, buf1, {
        mode,
        contentType: ct1,
      });
      if (ok1) {
        console.log("FALLBACK GOOGLE:", businessId);
        return true;
      }
    }
  }

  const fallback2 = `https://${cleanDomain}/favicon.ico`;
  const res2 = await fetch(fallback2, { method: "GET" });
  if (res2.ok) {
    const buf2 = new Uint8Array(await res2.arrayBuffer());
    if (buf2.length > 0) {
      const ct2 =
        res2.headers.get("content-type")?.split(";")[0]?.trim() || "image/x-icon";
      const ok2 = await uploadPngAndUpdateRow(adminSupabase, businessId, buf2, {
        mode,
        contentType: ct2,
      });
      if (ok2) {
        console.log("FALLBACK SITE:", businessId);
        return true;
      }
    }
  }

  return false;
}

async function processOne(adminSupabase, business) {
  const id = String(business.id ?? "");
  const logoUrl = String(business.logo_url ?? "").trim();

  // CASE A , migrate existing Logo.dev URL
  if (logoUrl && logoUrl.includes("img.logo.dev")) {
    const migrateDomain = cleanDomainFromLogoDevUrl(logoUrl);
    if (!migrateDomain) {
      await markLogoFetchFailed(adminSupabase, id);
      return;
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
    if (got) return;

    await markLogoFetchFailed(adminSupabase, id);
    return;
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
      return;
    }

    // 6. Validate
    if (!cleanDomain || cleanDomain.includes("(") || cleanDomain.includes("[")) {
      console.log("SKIP invalid domain:", raw);
      await markLogoFetchFailed(adminSupabase, id);
      return;
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
    if (gotFallback) return;

    await adminSupabase
      .from("businesses")
      .update({ logo_fetch_failed: true })
      .eq("id", id);
    console.log("FINAL FAILED:", id);
    return;
  }

  // CASE C , already has non–Logo.dev URL
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
    `[process:logos] start batch=${BATCH_SIZE} batchDelay=${BATCH_DELAY}ms`
  );

  while (true) {
    const { data, error } = await adminSupabase
      .from("businesses")
      .select("id,name,website,logo_url,logo_fetch_failed")
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
