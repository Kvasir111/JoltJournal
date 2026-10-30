import { useSupabaseForUser } from '../../utils/supabase'

export default defineEventHandler(async (event) => {
  const { supabase, user } = await useSupabaseForUser(event)
  const id = getRouterParam(event, 'id')
  if (!id || !/^\d+$/.test(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Wishlist item ID is invalid.' })
  }

  const { data, error } = await supabase
    .from('wishlist_items')
    .delete()
    .eq('id', Number(id))
    .eq('user_id', user.id)
    .select('id')
    .maybeSingle()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: `Could not remove wishlist item: ${error.message}` })
  }
  if (!data) {
    throw createError({ statusCode: 404, statusMessage: 'Wishlist item not found.' })
  }

  setResponseStatus(event, 204)
  return null
})
