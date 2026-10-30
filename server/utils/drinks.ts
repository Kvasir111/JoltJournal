import type { Drink, DrinkDraft } from '~/types/drink'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database'

export const normalizeLabel = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase()

export const parseDrinkDraft = (input: unknown): DrinkDraft => {
  if (!input || typeof input !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'A drink payload is required.' })
  }

  const payload = input as Record<string, unknown>
  const brand = typeof payload.brand === 'string' ? payload.brand.trim().replace(/\s+/g, ' ') : ''
  const flavor = typeof payload.flavor === 'string' ? payload.flavor.trim().replace(/\s+/g, ' ') : ''
  const rating = Number(payload.rating)
  const buyAgain = payload.buyAgain

  if (!brand || brand.length > 100) {
    throw createError({ statusCode: 400, statusMessage: 'Brand must be between 1 and 100 characters.' })
  }
  if (!flavor || flavor.length > 160) {
    throw createError({ statusCode: 400, statusMessage: 'Flavor must be between 1 and 160 characters.' })
  }
  if (!Number.isFinite(rating) || rating < 1 || rating > 10) {
    throw createError({ statusCode: 400, statusMessage: 'Rating must be between 1 and 10.' })
  }
  if (buyAgain !== 'yes' && buyAgain !== 'no' && buyAgain !== 'unknown') {
    throw createError({ statusCode: 400, statusMessage: 'Buy-again verdict is invalid.' })
  }

  return { brand, flavor, rating, buyAgain }
}

export const verdictToDatabase = (value: DrinkDraft['buyAgain']) => {
  if (value === 'unknown') return null
  return value === 'yes'
}

export const verdictFromDatabase = (value: boolean | null): Drink['buyAgain'] => {
  if (value === null) return 'unknown'
  return value ? 'yes' : 'no'
}

export const findOrCreateBrand = async (supabase: SupabaseClient<Database>, brand: string) => {
  const normalizedName = normalizeLabel(brand)
  const { data, error } = await supabase
    .from('brands')
    .insert({ name: brand, normalized_name: normalizedName })
    .select('id, name')
    .single()

  if (!error) return data

  if (error.code !== '23505') {
    throw createError({ statusCode: 500, statusMessage: `Could not save brand: ${error.message}` })
  }

  const { data: existing, error: lookupError } = await supabase
    .from('brands')
    .select('id, name')
    .eq('normalized_name', normalizedName)
    .single()

  if (lookupError) {
    throw createError({ statusCode: 500, statusMessage: `Could not load brand: ${lookupError.message}` })
  }

  return existing
}

export const mapDrinkRow = (row: {
  id: number
  brand_id: number
  flavor: string
  rating: number
  buy_again: boolean | null
  brands: { name: string } | Array<{ name: string }>
}): Drink => ({
  id: String(row.id),
  brandId: row.brand_id,
  brand: Array.isArray(row.brands) ? row.brands[0]?.name ?? 'Unknown' : row.brands.name,
  flavor: row.flavor,
  rating: Number(row.rating),
  buyAgain: verdictFromDatabase(row.buy_again)
})
