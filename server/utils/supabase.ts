import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import type { H3Event } from 'h3'
import type { Database } from '~/types/database'

export const useSupabasePublic = (): SupabaseClient<Database> => {
  const config = useRuntimeConfig()
  const url = config.public.supabaseUrl
  const publishableKey = config.public.supabasePublishableKey

  if (!url || !publishableKey) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Supabase authentication is not configured.'
    })
  }

  return createClient<Database>(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { 'X-Client-Info': 'jolt-journal-public-server' } }
  })
}

export const useSupabaseForUser = async (event: H3Event): Promise<{
  supabase: SupabaseClient<Database>
  user: User
}> => {
  const config = useRuntimeConfig()
  const url = config.public.supabaseUrl
  const publishableKey = config.public.supabasePublishableKey
  const authorization = getHeader(event, 'authorization')
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]

  if (!url || !publishableKey) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Supabase authentication is not configured.'
    })
  }
  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Sign in to access the archive.'
    })
  }

  const supabase = createClient<Database>(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Client-Info': 'jolt-journal-user-server'
      }
    }
  })
  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Your session is invalid or has expired.'
    })
  }

  const { data: isOwner, error: ownerError } = await supabase.rpc('is_site_owner')
  if (ownerError || !isOwner) {
    throw createError({
      statusCode: 403,
      statusMessage: 'This account does not have curator access.'
    })
  }

  return { supabase, user: data.user }
}
