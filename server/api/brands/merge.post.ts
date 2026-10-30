import { useSupabaseForUser } from '../../utils/supabase'

export default defineEventHandler(async (event) => {
  const { supabase } = await useSupabaseForUser(event)
  const payload = await readBody(event) as Record<string, unknown>
  const sourceBrandId = Number(payload?.sourceBrandId)
  const targetName = typeof payload?.targetName === 'string'
    ? payload.targetName.trim().replace(/\s+/g, ' ')
    : ''

  if (!Number.isSafeInteger(sourceBrandId) || sourceBrandId < 1) {
    throw createError({ statusCode: 400, statusMessage: 'Choose a source brand.' })
  }
  if (!targetName || targetName.length > 100) {
    throw createError({ statusCode: 400, statusMessage: 'Target brand must be between 1 and 100 characters.' })
  }

  const { data, error } = await supabase.rpc('merge_my_brand', {
    source_brand_id: sourceBrandId,
    requested_target_name: targetName
  })

  if (error) {
    const conflict = error.code === '23505'
    throw createError({
      statusCode: conflict ? 409 : 400,
      statusMessage: error.message
    })
  }

  return data[0]
})
