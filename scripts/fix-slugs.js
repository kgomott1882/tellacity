import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const BATCH_SIZE = 500

function slugify(name) {
  if (!name) return null

  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+$/, '')
    .trim()
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
      let base = slugify(b.name)

      if (!base || base === '') {
        base = `business-${b.id.slice(0, 8)}`
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
