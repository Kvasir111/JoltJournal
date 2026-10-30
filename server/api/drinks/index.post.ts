import { normalizeLabel, parseDrinkDraft, findOrCreateBrand, verdictToDatabase, mapDrinkRow } from '../../utils/drinks'
import { useSupabaseForUser } from '../../utils/supabase'

export default defineEventHandler(async (event) => {
  const { supabase, user } = await useSupabaseForUser(event)
  const draft = parseDrinkDraft(await readBody(event))
  const brand = await findOrCreateBrand(supabase, draft.brand)

  const { data, error } = await supabase
    .from('drinks')
    .insert({
      user_id: user.id,
      brand_id: brand.id,
      flavor: draft.flavor,
      normalized_flavor: normalizeLabel(draft.flavor),
      rating: draft.rating,
      buy_again: verdictToDatabase(draft.buyAgain)
    })
    .select('id, brand_id, flavor, rating, buy_again, brands!inner(name)')
    .single()

  if (error) {
    const duplicate = error.code === '23505'
    throw createError({
      statusCode: duplicate ? 409 : 500,
      statusMessage: duplicate ? 'That brand and flavor is already in the archive.' : `Could not add drink: ${error.message}`
    })
  }

  setResponseStatus(event, 201)
  return mapDrinkRow(data)
})
