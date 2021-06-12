import axios from 'axios'
import React, { useCallback, useState } from 'react'

export const request = axios.create({
   baseURL: '/api',
   headers: {
      'Content-Type': 'application/json',
   },
})

type Method = 'get' | 'post' | 'put' | 'delete'
export default function useSubmit<T>(endpoint: string, body?: Record<string, unknown>, params?: { method?: Method; onSuccess?: (t: T) => unknown | Promise<unknown> }) {
   const [error, setError] = useState<Error>()
   const [loading, setLoading] = useState(false)

   const onSubmit = useCallback(
      async (e?: React.FormEvent) => {
         try {
            e?.preventDefault()

            setLoading(true)
            setError(undefined)

            const response = await request[params?.method ?? 'post'](endpoint, body)
            await params?.onSuccess?.(response.data)
         } catch (e) {
            setError(e)
         } finally {
            setLoading(false)
         }
      },
      [endpoint, params, body, setError, setLoading]
   )

   return [onSubmit, error, loading] as [typeof onSubmit, Error | undefined, boolean]
}
