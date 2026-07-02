/**
 * Backfill review fraud risk scores for all existing reviews.
 *
 * Run from repo root: npx tsx scripts/backfillReviewRisk.ts
 */
import "dotenv/config";
import { config as loadEnvLocal } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { applyReviewRiskAfterInsert } from "../src/lib/reviews/applyReviewRisk";

loadEnvLocal({ path: ".env.local", override: true });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const pageSize = 200;
  let offset = 0;
  let processed = 0;
  const summary = { low: 0, medium: 0, high: 0, unscored: 0 };

  console.log("Starting review risk backfill…");

  for (;;) {
    const { data, error } = await supabase
      .from("reviews")
      .select("id")
      .order("created_at", { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error("Fetch failed:", error.message);
      process.exit(1);
    }

    const rows = data ?? [];
    if (rows.length === 0) break;

    for (const row of rows) {
      const id = String((row as { id: string }).id);
      await applyReviewRiskAfterInsert(supabase, id);

      const { data: updated } = await supabase
        .from("reviews")
        .select("risk_status")
        .eq("id", id)
        .maybeSingle();

      const status = (updated as { risk_status?: string } | null)?.risk_status
        ?.trim()
        .toLowerCase();

      if (status === "low") summary.low += 1;
      else if (status === "medium") summary.medium += 1;
      else if (status === "high") summary.high += 1;
      else summary.unscored += 1;

      processed += 1;
      if (processed % 50 === 0) {
        console.log(`Processed ${processed} reviews…`);
      }
    }

    if (rows.length < pageSize) break;
    offset += pageSize;
  }

  console.log("\nBackfill complete.");
  console.log(`Total processed: ${processed}`);
  console.log(`Low:    ${summary.low}`);
  console.log(`Medium: ${summary.medium}`);
  console.log(`High:   ${summary.high}`);
  if (summary.unscored > 0) {
    console.log(`Unscored / other: ${summary.unscored}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
