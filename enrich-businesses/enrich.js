import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import * as cheerio from 'cheerio';
import pLimit from 'p-limit';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '20', 10);
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '5', 10);
const TOTAL_TARGET = parseInt(process.env.TOTAL_TARGET || '1000', 10);
// PostgREST caps a single select at 1000 rows regardless of a higher .limit(),
// so each internal batch fetches at most 1000 eligible businesses.
const PER_BATCH = Math.min(BATCH_SIZE > 0 ? BATCH_SIZE : 1000, 1000);
const FETCH_TIMEOUT_MS = 12000;
const CONTENT_CAP = 8000;
const CONTACT_PATHS = ['/contact-us', '/contact', '/pages/contact-us'];

// Thrown when the Anthropic API reports a billing/credit/auth/rate-limit problem.
// Propagates up to stop the whole loop instead of burning through more businesses.
class BillingAuthError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BillingAuthError';
  }
}

async function getBatch(limit = PER_BATCH) {
  // Exclusion is done server-side by get_unstaged_businesses() so we never build
  // a giant client-side NOT IN list (unreliable past ~1000 staged rows).
  const { data, error } = await supabase.rpc('get_unstaged_businesses', { limit_count: limit });
  if (error) throw error;
  return data || [];
}

async function fetchPageText(url) {
  let target = url.trim();
  if (!/^https?:\/\//i.test(target)) target = `https://${target}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(target, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TellacityEnrichBot/1.0; +https://tellacity.com)' },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);
    $('script, style, nav, footer, noscript, svg').remove();
    const text = $('body').text().replace(/\s+/g, ' ').trim();
    return { url: target, text: text.slice(0, CONTENT_CAP) };
  } catch (err) {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeBase(url) {
  let base = url.trim();
  if (!/^https?:\/\//i.test(base)) base = `https://${base}`;
  return base.replace(/\/+$/, '');
}

async function fetchContactPage(website) {
  const base = normalizeBase(website);
  for (const path of CONTACT_PATHS) {
    const page = await fetchPageText(`${base}${path}`);
    if (page && page.text && page.text.length >= 50) return page;
  }
  return null;
}

async function extractFacts(businessName, pageText, sourceUrl) {
  const prompt = `You are extracting factual business information from raw webpage text. Do not guess, infer, or use outside knowledge. Only report what is explicitly present in the text below.

Business name: ${businessName}
Source page: ${sourceUrl}

Page text:
"""
${pageText}
"""

Return ONLY a JSON object, no markdown, no commentary, in this exact shape:
{
  "description": string or null,
  "address": string or null,
  "phone": string or null,
  "email": string or null,
  "hours": array or null,
  "confidence": "high" | "low" | "none"
}

For "hours": each array item must be { "dow": integer 0-6 (0=Sunday, 1=Monday ... 6=Saturday), "open_time": "HH:MM" (24-hour) or null, "close_time": "HH:MM" (24-hour) or null, "is_closed": boolean }. Only include days whose hours are explicitly stated on the page. Example: "M-F: 8am-7pm, Sat: 9am-1pm, Sun: Closed" -> 5 weekday entries (Mon-Fri, 08:00-19:00), a Saturday entry (09:00-13:00), and a Sunday entry with is_closed true. If no hours are stated anywhere on the page, set "hours" to null. Do not guess or assume typical hours for days not mentioned.`;

  let response;
  try {
    response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    });
  } catch (err) {
    const status = err?.status ?? err?.statusCode;
    const message = String(err?.message ?? err ?? '');
    // 429 (rate limit) is NOT a hard stop — let that one business fail and continue.
    const isBillingAuth =
      status === 401 || status === 403 ||
      /credit|billing|quota|insufficient|payment|unauthor|invalid[_ ]?api[_ ]?key/i.test(message);
    if (isBillingAuth) {
      throw new BillingAuthError(`Anthropic API billing/auth error (status ${status ?? 'n/a'}): ${message}`);
    }
    throw err;
  }
  const raw = response.content.map((b) => (b.type === 'text' ? b.text : '')).join('').trim().replace(/^```json\s*|\s*```$/g, '');
  let facts;
  try { facts = JSON.parse(raw); } catch { return { description: null, address: null, phone: null, email: null, hours: null, confidence: 'none' }; }
  // Cloudflare email protection leaves the literal "[email protected]" placeholder in text-only HTML; it is not a real address.
  if (facts && typeof facts.email === 'string' && /\[email\s*protected\]/i.test(facts.email)) {
    facts.email = null;
  }
  return facts;
}

function normalizeTime(value) {
  if (value == null) return null;
  const m = String(value).trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const hh = Math.min(23, parseInt(m[1], 10));
  const mm = Math.min(59, parseInt(m[2], 10));
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

async function upsertHours(businessId, sourceUrl, hours) {
  if (!Array.isArray(hours) || hours.length === 0) return 0;
  const seen = new Set();
  const rows = [];
  for (const h of hours) {
    const dow = Number(h?.dow);
    if (!Number.isInteger(dow) || dow < 0 || dow > 6 || seen.has(dow)) continue;
    const isClosed = h?.is_closed === true;
    const openTime = isClosed ? null : normalizeTime(h?.open_time);
    const closeTime = isClosed ? null : normalizeTime(h?.close_time);
    // Skip contradictory rows: "open" (is_closed false) but no usable times.
    if (!isClosed && openTime == null && closeTime == null) continue;
    seen.add(dow);
    rows.push({
      business_id: businessId,
      dow,
      open_time: openTime,
      close_time: closeTime,
      is_closed: isClosed,
      source_url: sourceUrl,
      status: 'pending',
    });
  }
  if (rows.length === 0) return 0;
  const { error } = await supabase
    .from('business_hours_staging')
    .upsert(rows, { onConflict: 'business_id,dow' });
  if (error) throw error;
  return rows.length;
}

async function processBusiness(business) {
  const page = await fetchPageText(business.website);
  if (!page || page.text.length < 50) {
    await supabase.from('business_enrichment_staging').upsert(
      { business_id: business.id, source_url: business.website, confidence: 'none', extracted_email: null, raw_snippet: null, status: 'pending' },
      { onConflict: 'business_id' }
    );
    console.log(`[skip] ${business.name} — could not fetch/parse website`);
    return;
  }
  const contact = await fetchContactPage(business.website);
  let combinedText = page.text;
  if (contact && contact.text) {
    combinedText = `${page.text}\n\n[Contact page: ${contact.url}]\n${contact.text}`;
  }
  combinedText = combinedText.slice(0, CONTENT_CAP);

  const facts = await extractFacts(business.name, combinedText, page.url);
  await supabase.from('business_enrichment_staging').upsert(
    { business_id: business.id, source_url: page.url, extracted_description: facts.description,
      extracted_address: facts.address, extracted_phone: facts.phone, extracted_email: facts.email,
      confidence: facts.confidence, raw_snippet: combinedText.slice(0, 2000), status: 'pending' },
    { onConflict: 'business_id' }
  );
  const hoursCount = await upsertHours(business.id, page.url, facts.hours);
  console.log(`[done] ${business.name} — confidence: ${facts.confidence}${contact ? ' (+contact)' : ''}${hoursCount ? ` (+${hoursCount}d hours)` : ''}`);
}

async function main() {
  const limit = pLimit(CONCURRENCY);
  let totalProcessed = 0;
  let totalFailed = 0;
  let batchNo = 0;

  while (totalProcessed < TOTAL_TARGET) {
    const remaining = TOTAL_TARGET - totalProcessed;
    const fetchSize = Math.min(PER_BATCH, remaining);
    const batch = await getBatch(fetchSize);
    if (!batch || batch.length === 0) {
      console.log('\nNo more eligible businesses to process.');
      break;
    }

    batchNo += 1;
    console.log(`\n[batch ${batchNo}] Processing ${batch.length} businesses (concurrency: ${CONCURRENCY})...\n`);
    const results = await Promise.allSettled(batch.map((b) => limit(() => processBusiness(b))));

    // Halt immediately if any business failed due to a billing/auth/rate-limit problem.
    const billingStop = results.find(
      (r) => r.status === 'rejected' && r.reason && r.reason.name === 'BillingAuthError'
    );
    if (billingStop) {
      totalProcessed += results.filter((r) => r.status === 'fulfilled').length;
      console.error(`\nSTOPPED: billing/auth error detected, halting run — ${billingStop.reason.message}`);
      console.log(`Running total: ${totalProcessed}/${TOTAL_TARGET} processed before stop.`);
      process.exit(1);
    }

    const failed = results.filter((r) => r.status === 'rejected').length;
    totalFailed += failed;
    totalProcessed += batch.length;
    console.log(`\n[batch ${batchNo}] complete. ${batch.length - failed} succeeded, ${failed} errored.`);
    console.log(`Running total: ${totalProcessed}/${TOTAL_TARGET} processed`);
  }

  console.log(`\nAll done. ${totalProcessed} processed (${totalFailed} errored) across ${batchNo} batch(es).`);
  console.log('Review results in the business_enrichment_staging table in Supabase.');
}

main().catch((err) => { console.error('Fatal error:', err); process.exit(1); });
