import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database'

let browserClient: SupabaseClient<Database> | undefined

export const useSupabaseBrowser = () => {
  if (import.meta.server) {
    throw new Error('The browser Supabase client is unavailable during server rendering.')
  }

  const config = useRuntimeConfig()
  const url = config.public.supabaseUrl
  const publishableKey = config.public.supabasePublishableKey

  if (!url || !publishableKey) {
    throw new Error('Supabase authentication is not configured.')
  }

  browserClient ??= createClient<Database>(url, publishableKey, {
    auth: {
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true
    },
    global: {
      headers: { 'X-Client-Info': 'jolt-journal-browser' }
    }
  })

  return browserClient
}
