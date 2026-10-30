import { readFile } from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const secretKey = process.env.SUPABASE_SECRET_KEY

if (!url || !secretKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY are required to seed the database.')
}

const drinks = JSON.parse(
  await readFile(new URL('../app/data/drinks.json', import.meta.url), 'utf8')
)
const normalizeLabel = value => value.trim().replace(/\s+/g, ' ').toLowerCase()
const supabase = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const brandsByNormalizedName = new Map()
for (const drink of drinks) {
  const normalizedName = normalizeLabel(drink.brand)
  brandsByNormalizedName.set(normalizedName, {
    name: drink.brand.trim().replace(/\s+/g, ' '),
    normalized_name: normalizedName
  })
}

const { data: brands, error: brandError } = await supabase
  .from('brands')
  .upsert([...brandsByNormalizedName.values()], { onConflict: 'normalized_name' })
  .select('id, normalized_name')

if (brandError) throw new Error(`Could not seed brands: ${brandError.message}`)

const brandIds = new Map(brands.map(brand => [brand.normalized_name, brand.id]))
const rows = drinks.map((drink) => ({
  source_key: drink.id,
  user_id: null,
  brand_id: brandIds.get(normalizeLabel(drink.brand)),
  flavor: drink.flavor.trim().replace(/\s+/g, ' '),
  normalized_flavor: normalizeLabel(drink.flavor),
  rating: drink.rating,
  buy_again: drink.buyAgain === 'unknown' ? null : drink.buyAgain === 'yes',
  updated_at: new Date().toISOString()
}))

for (let offset = 0; offset < rows.length; offset += 100) {
  const { error } = await supabase
    .from('drinks')
    .upsert(rows.slice(offset, offset + 100), { onConflict: 'source_key' })

  if (error) throw new Error(`Could not seed drinks at row ${offset + 1}: ${error.message}`)
}

const { count, error: countError } = await supabase
  .from('drinks')
  .select('id', { count: 'exact', head: true })
  .is('user_id', null)

if (countError) throw new Error(`Could not verify the seed: ${countError.message}`)

console.log(`Seeded ${brands.length} brands and ${rows.length} drinks. Database now has ${count} pre-auth drinks.`)
