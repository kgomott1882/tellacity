/**
 * DEPRECATED: do not run against production.
 *
 * Superseded by the new country+city+suffix canonical_slug design. This old
 * script generates name-only canonical_slug values and is retained only as
 * historical reference until the replacement flow is shipped.
 *
 * Backfill businesses.canonical_slug from business names (businessNameToSlug).
 * Only updates rows where canonical_slug IS NULL. Does not change `slug`.
 *
 * Run from repo root: npx tsx scripts/generateCanonicalSlugs.ts
 */
import "dotenv/config";
import { config as loadEnvLocal } from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

loadEnvLocal({ path: ".env.local", override: true });

// --- Duplicated from src/lib/businessSlug.ts (keep in sync manually; avoids ts-node / path resolution) ---
const PLACEHOLDER_TOKENS = new Set([
  "unknown",
  "[unknown]",
  "null",
  "n/a",
  "na",
  "tbd",
]);

const GEO_PHRASES_DESC: string[] = [
  "united states of america",
  "united kingdom",
  "united states",
  "new zealand",
  "south africa",
  "south korea",
  "north korea",
  "hong kong",
  "great britain",
  "northern ireland",
  "costa rica",
  "puerto rico",
  "czech republic",
  "dominican republic",
  "saudi arabia",
  "sri lanka",
  "el salvador",
  "bosnia and herzegovina",
  "trinidad and tobago",
  "papua new guinea",
].sort((a, b) => b.split(" ").length - a.split(" ").length);

function normalizeToken(token: string): string {
  return token.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function stripTrailingGeoPhrases(tokens: string[]): string[] {
  if (tokens.length === 0) return tokens;
  let t = [...tokens];
  let changed = true;
  while (changed && t.length > 0) {
    changed = false;
    const lw = t.map(normalizeToken);
    for (const phrase of GEO_PHRASES_DESC) {
      const pl = phrase.split(/\s+/).map((p) => p.replace(/[^a-z0-9]/g, ""));
      if (pl.length > t.length || pl.some((p) => !p)) continue;
      const tail = lw.slice(-pl.length);
      if (tail.every((w, i) => w.length > 0 && w === pl[i])) {
        t = t.slice(0, -pl.length);
        changed = true;
        break;
      }
    }
  }
  return t;
}

function businessNameToSlug(name: string): string {
  const raw = typeof name === "string" ? name.trim() : "";
  if (!raw) return "";

  let tokens = raw.split(/\s+/).filter(Boolean);
  tokens = tokens.filter((tok) => {
    const key = tok.toLowerCase().replace(/[\[\]]/g, "");
    return !PLACEHOLDER_TOKENS.has(key);
  });
  tokens = stripTrailingGeoPhrases(tokens);

  const parts = tokens
    .map((tok) => normalizeToken(tok))
    .filter((w) => w.length > 0);

  const slug = parts.join("-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return slug;
}
// --- end duplicate ---

const BATCH_SIZE = 500;

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v?.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v.trim();
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function allocateCanonicalSlug(
  supabase: SupabaseClient,
  base: string,
  assignedThisRun: Set<string>
): Promise<string> {
  const b = base || "business";
  let candidate = b;
  let counter = 0;

  for (;;) {
    if (assignedThisRun.has(candidate)) {
      counter += 1;
      candidate = `${b}-${counter}`;
      continue;
    }

    const { data } = await supabase
      .from("businesses")
      .select("id")
      .eq("canonical_slug", candidate)
      .maybeSingle();

    if (!data) {
      assignedThisRun.add(candidate);
      return candidate;
    }

    counter += 1;
    candidate = `${b}-${counter}`;
    if (counter > 10_000) {
      throw new Error(`Could not allocate canonical_slug for base "${b}"`);
    }
  }
}

async function main() {
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(
    `[generateCanonicalSlugs] batch=${BATCH_SIZE} cursor on id (canonical_slug IS NULL only)`
  );

  let totalUpdated = 0;
  let lastId = "";

  for (;;) {
    let query = supabase
      .from("businesses")
      .select("id, name, canonical_slug")
      .is("canonical_slug", null)
      .order("id", { ascending: true })
      .limit(BATCH_SIZE);

    if (lastId) {
      query = query.gt("id", lastId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[generateCanonicalSlugs] batch query failed:", error.message);
      process.exit(1);
    }

    const batch = data ?? [];
    if (batch.length === 0) {
      break;
    }

    const assignedThisRun = new Set<string>();

    for (const row of batch) {
      const id = String(row.id ?? "");
      const name = typeof row.name === "string" ? row.name : "";
      const baseSlug =
        businessNameToSlug(name || "business") || "business";

      const canonical = await allocateCanonicalSlug(
        supabase,
        baseSlug,
        assignedThisRun
      );

      const { error: updateError } = await supabase
        .from("businesses")
        .update({ canonical_slug: canonical })
        .eq("id", id)
        .is("canonical_slug", null);

      if (updateError) {
        console.error(
          `[generateCanonicalSlugs] update failed id=${id}:`,
          updateError.message
        );
        continue;
      }

      console.log(`✔ ${name.trim() || "(no name)"} → ${canonical}`);
      totalUpdated += 1;
    }

    const tailId = String(batch[batch.length - 1]?.id ?? "");
    if (!tailId) {
      console.error("[generateCanonicalSlugs] last row missing id; stopping to avoid a loop.");
      process.exit(1);
    }
    lastId = tailId;

    await sleep(150);
  }

  console.log(`[generateCanonicalSlugs] done. Updated ${totalUpdated} row(s).`);
}

main().catch((e) => {
  console.error("[generateCanonicalSlugs] fatal:", e);
  process.exit(1);
});
