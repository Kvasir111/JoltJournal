import { mapDrinkRow, normalizeLabel, parseDrinkDraft, findOrCreateBrand, verdictToDatabase } from '../../utils/drinks'
import { useSupabaseForUser } from '../../utils/supabase'

export default defineEventHandler(async (event) => {
  const { supabase, user } = await useSupabaseForUser(event)
  const id = getRouterParam(event, 'id')
  if (!id || !/^\d+$/.test(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Drink ID is invalid.' })
  }

  const draft = parseDrinkDraft(await readBody(event))
  const brand = await findOrCreateBrand(supabase, draft.brand)
  const { data, error } = await supabase
    .from('drinks')
    .update({
      brand_id: brand.id,
      flavor: draft.flavor,
      normalized_flavor: normalizeLabel(draft.flavor),
      rating: draft.rating,
      buy_again: verdictToDatabase(draft.buyAgain),
      updated_at: new Date().toISOString()
    })
    .eq('id', Number(id))
    .eq('user_id', user.id)
    .select('id, brand_id, flavor, rating, buy_again, brands!inner(name)')
    .single()

  if (error) {
    const duplicate = error.code === '23505'
    const missing = error.code === 'PGRST116'
    throw createError({
      statusCode: duplicate ? 409 : missing ? 404 : 500,
      statusMessage: duplicate
        ? 'That brand and flavor is already in the archive.'
        : missing
          ? 'Drink not found.'
          : `Could not update drink: ${error.message}`
    })
  }

  return mapDrinkRow(data)
})
