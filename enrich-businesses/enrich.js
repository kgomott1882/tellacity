import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import * as cheerio from 'cheerio';
import pLimit from 'p-limit';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '20', 10);
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '5', 10);
const FETCH_TIMEOUT_MS = 12000;

async function getBatch() {
  const { data: alreadyStaged, error: stagedErr } = await supabase
    .from('business_enrichment_staging').select('business_id');
  if (stagedErr) throw stagedErr;
  const stagedIds = (alreadyStaged || []).map((r) => r.business_id);

  let query = supabase.from('businesses')
    .select('id, name, website, description, address, phone')
    .not('website', 'is', null).neq('website', '')
    .or('description.is.null,address.is.null,phone.is.null')
    .limit(BATCH_SIZE);

  if (stagedIds.length > 0) query = query.not('id', 'in', `(${stagedIds.join(',')})`);
  const { data, error } = await query;
  if (error) throw error;
  return data;
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
    return { url: target, text: text.slice(0, 6000) };
  } catch (err) {
    return null;
  } finally {
    clearTimeout(timeout);
  }
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
  "confidence": "high" | "low" | "none"
}`;

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  });
  const raw = response.content.map((b) => (b.type === 'text' ? b.text : '')).join('').trim().replace(/^```json\s*|\s*```$/g, '');
  try { return JSON.parse(raw); } catch { return { description: null, address: null, phone: null, confidence: 'none' }; }
}

async function processBusiness(business) {
  const page = await fetchPageText(business.website);
  if (!page || page.text.length < 50) {
    await supabase.from('business_enrichment_staging').upsert(
      { business_id: business.id, source_url: business.website, confidence: 'none', raw_snippet: null, status: 'pending' },
      { onConflict: 'business_id' }
    );
    console.log(`[skip] ${business.name} — could not fetch/parse website`);
    return;
  }
  const facts = await extractFacts(business.name, page.text, page.url);
  await supabase.from('business_enrichment_staging').upsert(
    { business_id: business.id, source_url: page.url, extracted_description: facts.description,
      extracted_address: facts.address, extracted_phone: facts.phone, confidence: facts.confidence,
      raw_snippet: page.text.slice(0, 2000), status: 'pending' },
    { onConflict: 'business_id' }
  );
  console.log(`[done] ${business.name} — confidence: ${facts.confidence}`);
}

async function main() {
  const batch = await getBatch();
  if (!batch || batch.length === 0) { console.log('No businesses left to process in this batch.'); return; }
  console.log(`Processing ${batch.length} businesses (concurrency: ${CONCURRENCY})...\n`);
  const limit = pLimit(CONCURRENCY);
  const results = await Promise.allSettled(batch.map((b) => limit(() => processBusiness(b))));
  const failed = results.filter((r) => r.status === 'rejected').length;
  console.log(`\nBatch complete. ${batch.length - failed} succeeded, ${failed} errored.`);
  console.log('Review results in the business_enrichment_staging table in Supabase.');
}

main().catch((err) => { console.error('Fatal error:', err); process.exit(1); });
