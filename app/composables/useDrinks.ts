import type { Drink, DrinkDraft } from '~/types/drink'

export const useDrinks = () => {
  const { getAccessToken } = useAuth()
  const drinks = useState<Drink[]>('drinks', () => [])
  const pending = useState('drinks-pending', () => false)
  const error = useState<string | null>('drinks-error', () => null)

  const run = async <T>(operation: () => Promise<T>) => {
    pending.value = true
    error.value = null
    try {
      return await operation()
    } catch (cause) {
      const requestError = cause as {
        data?: { statusMessage?: string }
        statusMessage?: string
        message?: string
      }
      error.value = requestError.data?.statusMessage
        ?? requestError.statusMessage
        ?? requestError.message
        ?? 'The archive request failed.'
      throw cause
    } finally {
      pending.value = false
    }
  }

  const authHeaders = async () => ({
    Authorization: `Bearer ${await getAccessToken()}`
  })

  const hydrate = async () => {
    await run(async () => {
      drinks.value = await $fetch<Drink[]>('/api/drinks')
    })
  }

  const addDrink = async (draft: DrinkDraft) => {
    const drink = await run(async () => $fetch<Drink>('/api/drinks', {
      method: 'POST',
      headers: await authHeaders(),
      body: draft
    }))
    drinks.value.unshift(drink)
    return drink
  }

  const updateDrink = async (id: string, draft: DrinkDraft) => {
    const endpoint = `/api/drinks/${id}` as '/api/drinks/:id'
    const drink = await run(async () => $fetch<Drink>(endpoint, {
      method: 'PUT',
      headers: await authHeaders(),
      body: draft
    }))
    const index = drinks.value.findIndex((item) => item.id === id)
    if (index !== -1) drinks.value[index] = drink
    drinks.value = [...drinks.value]
    return drink
  }

  const deleteDrink = async (id: string) => {
    const endpoint = `/api/drinks/${id}` as '/api/drinks/:id'
    await run(async () => $fetch<null>(endpoint, {
      method: 'DELETE',
      headers: await authHeaders()
    }))
    drinks.value = drinks.value.filter((drink) => drink.id !== id)
  }

  const clear = () => {
    drinks.value = []
    error.value = null
  }

  return { drinks, pending, error, hydrate, addDrink, updateDrink, deleteDrink, clear }
}
