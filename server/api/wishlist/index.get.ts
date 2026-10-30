import { mapWishlistRow } from '../../utils/wishlist'
import { useSupabaseForUser } from '../../utils/supabase'

export default defineEventHandler(async (event) => {
  const { supabase, user } = await useSupabaseForUser(event)
  const { data, error } = await supabase
    .from('wishlist_items')
    .select('id, brand_id, flavor, created_at, brands!inner(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: `Could not load wishlist: ${error.message}` })
  }

  return data.map(mapWishlistRow)
})
