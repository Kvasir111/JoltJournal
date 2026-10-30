import { mapDrinkRow } from '../../utils/drinks'
import { useSupabasePublic } from '../../utils/supabase'

export default defineEventHandler(async () => {
  const supabase = useSupabasePublic()
  const { data, error } = await supabase
    .from('drinks')
    .select('id, brand_id, flavor, rating, buy_again, brands!inner(name)')
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: `Could not load drinks: ${error.message}` })
  }

  return data.map(mapDrinkRow)
})
