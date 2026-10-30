export const useBrands = () => {
  const { getAccessToken } = useAuth()
  const pending = useState('brands-pending', () => false)
  const error = useState<string | null>('brands-error', () => null)

  const merge = async (sourceBrandId: number, targetName: string) => {
    pending.value = true
    error.value = null
    try {
      return await $fetch('/api/brands/merge', {
        method: 'POST',
        headers: { Authorization: `Bearer ${await getAccessToken()}` },
        body: { sourceBrandId, targetName }
      })
    } catch (cause) {
      const requestError = cause as { data?: { statusMessage?: string }, statusMessage?: string, message?: string }
      error.value = requestError.data?.statusMessage ?? requestError.statusMessage ?? requestError.message ?? 'Could not merge brands.'
      throw cause
    } finally {
      pending.value = false
    }
  }

  return { pending, error, merge }
}
