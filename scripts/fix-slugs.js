import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const BATCH_SIZE = 500

const PLACEHOLDER_TOKENS = new Set([
  'unknown',
  '[unknown]',
  'null',
  'n/a',
  'na',
  'tbd',
])

const GEO_PHRASES_DESC = [
  'united states of america',
  'united kingdom',
  'united states',
  'new zealand',
  'south africa',
  'south korea',
  'north korea',
  'hong kong',
  'great britain',
  'northern ireland',
  'costa rica',
  'puerto rico',
  'czech republic',
  'dominican republic',
  'saudi arabia',
  'sri lanka',
  'el salvador',
  'bosnia and herzegovina',
  'trinidad and tobago',
  'papua new guinea',
].sort((a, b) => b.split(/\s+/).length - a.split(/\s+/).length)

function normalizeToken(token) {
  return token.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function stripTrailingGeoPhrases(tokens) {
  if (tokens.length === 0) return tokens
  let t = [...tokens]
  let changed = true
  while (changed && t.length > 0) {
    changed = false
    const lw = t.map(normalizeToken)
    for (const phrase of GEO_PHRASES_DESC) {
      const pl = phrase.split(/\s+/).map((p) => p.replace(/[^a-z0-9]/g, ''))
      if (pl.length > t.length || pl.some((p) => !p)) continue
      const tail = lw.slice(-pl.length)
      if (tail.every((w, i) => w.length > 0 && w === pl[i])) {
        t = t.slice(0, -pl.length)
        changed = true
        break
      }
    }
  }
  return t
}

/** Same rules as src/lib/businessSlug.ts — name only, no city/country/id in the base slug. */
function businessNameToSlug(name) {
  const raw = typeof name === 'string' ? name.trim() : ''
  if (!raw) return ''

  let tokens = raw.split(/\s+/).filter(Boolean)
  tokens = tokens.filter((tok) => {
    const key = tok.toLowerCase().replace(/[\[\]]/g, '')
    return !PLACEHOLDER_TOKENS.has(key)
  })
  tokens = stripTrailingGeoPhrases(tokens)

  const parts = tokens
    .map((tok) => normalizeToken(tok))
    .filter((w) => w.length > 0)

  return parts.join('-').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

async function run() {
  console.log('🚀 Starting slug migration...')

  let processed = 0
  let hasMore = true

  // GLOBAL slug tracking (ensures uniqueness across entire DB)
  const globalSlugSet = new Set()

  while (hasMore) {
    const { data, error } = await supabase
      .from('businesses')
      .select('id, name')
      .range(processed, processed + BATCH_SIZE - 1)

    if (error) {
      console.error('❌ Fetch error:', error)
      break
    }

    if (!data || data.length === 0) {
      hasMore = false
      break
    }

    const updates = []

    for (const b of data) {
      let base = businessNameToSlug(b.name)

      if (!base || base === '') {
        base = 'business'
      }

      let finalSlug = base
      let counter = 1

      // ensure GLOBAL uniqueness
      while (globalSlugSet.has(finalSlug)) {
        finalSlug = `${base}-${counter}`
        counter++
      }

      globalSlugSet.add(finalSlug)

      updates.push({
        id: b.id,
        slug: finalSlug
      })
    }

    for (const row of updates) {
      const { error: updateError } = await supabase
        .from('businesses')
        .update({ slug: row.slug })
        .eq('id', row.id)

      if (updateError) {
        console.error('❌ Update error:', updateError)
      }
    }

    processed += data.length
    console.log(`✅ Processed: ${processed}`)

    await new Promise((r) => setTimeout(r, 150))
  }

  console.log('🎉 Slug migration completed')
}

run()
