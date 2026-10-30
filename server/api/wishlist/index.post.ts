import { findOrCreateBrand, normalizeLabel } from '../../utils/drinks'
import { mapWishlistRow, parseWishlistDraft } from '../../utils/wishlist'
import { useSupabaseForUser } from '../../utils/supabase'

export default defineEventHandler(async (event) => {
  const { supabase, user } = await useSupabaseForUser(event)
  const draft = parseWishlistDraft(await readBody(event))
  const brand = await findOrCreateBrand(supabase, draft.brand)
  const { data, error } = await supabase
    .from('wishlist_items')
    .insert({
      user_id: user.id,
      brand_id: brand.id,
      flavor: draft.flavor,
      normalized_flavor: normalizeLabel(draft.flavor)
    })
    .select('id, brand_id, flavor, created_at, brands!inner(name)')
    .single()

  if (error) {
    const duplicate = error.code === '23505'
    throw createError({
      statusCode: duplicate ? 409 : 500,
      statusMessage: duplicate ? 'That flavor is already on your wishlist.' : `Could not add wishlist item: ${error.message}`
    })
  }

  setResponseStatus(event, 201)
  return mapWishlistRow(data)
})
