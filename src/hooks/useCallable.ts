import { useState, useCallback } from 'react'
import { httpsCallable, type HttpsCallableResult } from 'firebase/functions'
import { functions } from '@/lib/firebase'

export function useCallable<TInput, TOutput>(functionName: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const call = useCallback(async (data: TInput): Promise<TOutput | null> => {
    setLoading(true)
    setError(null)
    try {
      const fn = httpsCallable<TInput, TOutput>(functions, functionName, { timeout: 10000 })
      const result: HttpsCallableResult<TOutput> = await fn(data)
      return result.data
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string; message?: string }
      if (firebaseErr.code === 'functions/unavailable' || firebaseErr.message?.includes('network')) {
        setError("You're offline. This action needs a connection.")
      } else {
        setError(firebaseErr.message || 'Something went wrong.')
      }
      return null
    } finally {
      setLoading(false)
    }
  }, [functionName])

  return { call, loading, error }
}
