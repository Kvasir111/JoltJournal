import { useSupabaseForUser } from '../../utils/supabase'

export default defineEventHandler(async (event) => {
  const { user } = await useSupabaseForUser(event)
  return { owner: true, email: user.email ?? null }
})
