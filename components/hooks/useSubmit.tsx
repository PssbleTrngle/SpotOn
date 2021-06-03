import axios from "axios";
import { useCallback, useState } from "react";

export const request = axios.create({
   baseURL: '/api',
   headers: {
      'Content-Type': 'application/json',
   }
})

type Method = 'get' | 'post' | 'put' | 'delete'
export default function useSubmit(endpoint: string, body?: Record<string, unknown>, method: Method = 'post') {
   const [error, setError] = useState<Error>()
   const [loading, setLoading] = useState(false)

   const onSubmit = useCallback(async () => {
      try {
         setLoading(true)
         setError(undefined)

         await request[method](endpoint, body)

      } catch (e) {
         setError(error)
      } finally {
         setLoading(false)
      }
   }, [endpoint])

   return [onSubmit, error, loading] as [typeof onSubmit, Error | undefined, boolean]
}