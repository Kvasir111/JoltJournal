import { mapDrinkRow } from '../../utils/drinks'
import { useSupabaseForUser } from '../../utils/supabase'

export default defineEventHandler(async (event) => {
  const { supabase, user } = await useSupabaseForUser(event)
  const { data, error } = await supabase
    .from('drinks')
    .select('id, brand_id, flavor, rating, buy_again, brands!inner(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: `Could not load drinks: ${error.message}` })
  }

  return data.map(mapDrinkRow)
})
