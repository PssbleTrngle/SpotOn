import Cache from 'node-cache'

export default async function cacheOr<T>(key: string, supplier: () => T | Promise<T>): Promise<T> {
   global.cache = global.cache ?? new Cache({ stdTTL: 60 })
   const promise = `${key}#promise`

   const cached = global.cache.get<T>(key) ?? global.cache.get<Promise<T>>(promise)
   if (cached) return cached

   const supplied = supplier()
   global.cache.set(promise, supplied)
   global.cache.set(key, await supplied)

   return supplied
}

export function invalidate(key: string) {
   if (global.cache) {
      global.cache.del(key)
   }
}
