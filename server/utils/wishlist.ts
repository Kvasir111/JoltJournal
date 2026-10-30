import type { WishlistDraft, WishlistItem } from '~/types/drink'

export const parseWishlistDraft = (input: unknown): WishlistDraft => {
  if (!input || typeof input !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'A wishlist payload is required.' })
  }

  const payload = input as Record<string, unknown>
  const brand = typeof payload.brand === 'string' ? payload.brand.trim().replace(/\s+/g, ' ') : ''
  const flavor = typeof payload.flavor === 'string' ? payload.flavor.trim().replace(/\s+/g, ' ') : ''

  if (!brand || brand.length > 100) {
    throw createError({ statusCode: 400, statusMessage: 'Brand must be between 1 and 100 characters.' })
  }
  if (!flavor || flavor.length > 160) {
    throw createError({ statusCode: 400, statusMessage: 'Flavor must be between 1 and 160 characters.' })
  }

  return { brand, flavor }
}

export const mapWishlistRow = (row: {
  id: number
  brand_id: number
  flavor: string
  created_at: string
  brands: { name: string } | Array<{ name: string }>
}): WishlistItem => ({
  id: String(row.id),
  brandId: row.brand_id,
  brand: Array.isArray(row.brands) ? row.brands[0]?.name ?? 'Unknown' : row.brands.name,
  flavor: row.flavor,
  createdAt: row.created_at
})
