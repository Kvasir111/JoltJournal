import type { User } from '@supabase/supabase-js'

let listenerStarted = false

export const useAuth = () => {
  const user = useState<User | null>('auth-user', () => null)
  const ready = useState('auth-ready', () => false)
  const pending = useState('auth-pending', () => false)
  const error = useState<string | null>('auth-error', () => null)
  const notice = useState<string | null>('auth-notice', () => null)

  const messageFrom = (cause: unknown) => {
    if (cause instanceof Error) return cause.message
    return 'The authentication request failed.'
  }

  const initialize = async () => {
    if (import.meta.server || ready.value) return
    const supabase = useSupabaseBrowser()
    const { data } = await supabase.auth.getUser()
    user.value = data.user

    if (!listenerStarted) {
      listenerStarted = true
      supabase.auth.onAuthStateChange((_event, session) => {
        user.value = session?.user ?? null
      })
    }

    ready.value = true
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
      user.value = data.user
    } catch (cause) {
      error.value = messageFrom(cause)
      throw cause
    } finally {
      pending.value = false
    }
  }

  const signUp = async (email: string, password: string) => {
    pending.value = true
    error.value = null
    notice.value = null
    try {
      const { data, error: signUpError } = await useSupabaseBrowser().auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin }
      })
      if (signUpError) throw signUpError
      user.value = data.session?.user ?? null
      notice.value = data.session
        ? 'Account created and signed in.'
        : 'Check your email to confirm your account, then return here to sign in.'
    } catch (cause) {
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

  return { user, ready, pending, error, notice, initialize, signIn, signUp, signOut, getAccessToken }
}
