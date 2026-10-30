import type { User } from '@supabase/supabase-js'

let listenerStarted = false

export const useAuth = () => {
  const user = useState<User | null>('auth-user', () => null)
  const ready = useState('auth-ready', () => false)
  const pending = useState('auth-pending', () => false)
  const error = useState<string | null>('auth-error', () => null)
  const notice = useState<string | null>('auth-notice', () => null)

  const messageFrom = (cause: unknown) => {
    const requestError = cause as { data?: { statusMessage?: string }, statusMessage?: string }
    if (requestError?.data?.statusMessage) return requestError.data.statusMessage
    if (requestError?.statusMessage) return requestError.statusMessage
    if (cause instanceof Error) return cause.message
    return 'The authentication request failed.'
  }

  const verifyOwner = async (accessToken: string) => {
    await $fetch('/api/auth/owner', {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
  }

  const initialize = async () => {
    if (import.meta.server || ready.value) return
    try {
      const supabase = useSupabaseBrowser()
      const { data, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError
      if (data.session) {
        await verifyOwner(data.session.access_token)
        user.value = data.session.user
      }

      if (!listenerStarted) {
        listenerStarted = true
        supabase.auth.onAuthStateChange((_event, session) => {
          user.value = session?.user ?? null
        })
      }
    } catch (cause) {
      try {
        await useSupabaseBrowser().auth.signOut({ scope: 'local' })
      } catch {
        // Configuration failures have no client session to clear.
      }
      user.value = null
      error.value = messageFrom(cause)
    } finally {
      ready.value = true
    }
  }

  const signIn = async (email: string, password: string) => {
    pending.value = true
    error.value = null
    notice.value = null
    try {
      const { data, error: signInError } = await useSupabaseBrowser().auth.signInWithPassword({
        email,
        password
      })
      if (signInError) throw signInError
      if (!data.session) throw new Error('Supabase did not return a session.')
      await verifyOwner(data.session.access_token)
      user.value = data.user
    } catch (cause) {
      await useSupabaseBrowser().auth.signOut({ scope: 'local' }).catch(() => undefined)
      user.value = null
      error.value = messageFrom(cause)
      throw cause
    } finally {
      pending.value = false
    }
  }

  const signOut = async () => {
    pending.value = true
    error.value = null
    try {
      const { error: signOutError } = await useSupabaseBrowser().auth.signOut()
      if (signOutError) throw signOutError
      user.value = null
    } catch (cause) {
      error.value = messageFrom(cause)
      throw cause
    } finally {
      pending.value = false
    }
  }

  const getAccessToken = async () => {
    const { data, error: sessionError } = await useSupabaseBrowser().auth.getSession()
    if (sessionError || !data.session?.access_token) {
      throw new Error('Your session has expired. Sign in again to continue.')
    }
    return data.session.access_token
  }

  return { user, ready, pending, error, notice, initialize, signIn, signOut, getAccessToken }
}
