import type { WishlistDraft, WishlistItem } from '~/types/drink'

export const useWishlist = () => {
  const { getAccessToken } = useAuth()
  const items = useState<WishlistItem[]>('wishlist-items', () => [])
  const pending = useState('wishlist-pending', () => false)
  const error = useState<string | null>('wishlist-error', () => null)

  const authHeaders = async () => ({ Authorization: `Bearer ${await getAccessToken()}` })
  const run = async <T>(operation: () => Promise<T>) => {
    pending.value = true
    error.value = null
    try {
      return await operation()
    } catch (cause) {
      const requestError = cause as { data?: { statusMessage?: string }, statusMessage?: string, message?: string }
      error.value = requestError.data?.statusMessage ?? requestError.statusMessage ?? requestError.message ?? 'The wishlist request failed.'
      throw cause
    } finally {
      pending.value = false
    }
  }

  const hydrate = async () => run(async () => {
    items.value = await $fetch<WishlistItem[]>('/api/wishlist', { headers: await authHeaders() })
  })

  const add = async (draft: WishlistDraft) => {
    const item = await run(async () => $fetch<WishlistItem>('/api/wishlist', {
      method: 'POST', headers: await authHeaders(), body: draft
    }))
    items.value.unshift(item)
    return item
  }

  const remove = async (id: string) => {
    const endpoint = `/api/wishlist/${id}` as '/api/wishlist/:id'
    await run(async () => $fetch<null>(endpoint, { method: 'DELETE', headers: await authHeaders() }))
    items.value = items.value.filter(item => item.id !== id)
  }

  const clear = () => { items.value = []; error.value = null }

  return { items, pending, error, hydrate, add, remove, clear }
}
