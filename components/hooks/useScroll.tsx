import { debounce } from "lodash";
import { createContext, createRef, MutableRefObject, useCallback, useContext, useEffect, useState } from "react";

const CONTEXT = createContext<MutableRefObject<HTMLElement | null>>(createRef())

export default function useScroll(hitBottom: () => unknown | Promise<unknown>, { space = 0.5, snap = false } = {}) {
   const ref = useContext(CONTEXT)
   const [, setLoading] = useState(false)

   const scrollDown = useCallback(() => {
      setLoading(false)
      const { current } = ref
      if (current && snap) {
         const total = current.scrollHeight - current.offsetHeight
         current.scrollTop = Math.min(total, current.scrollTop + 400)
      }
   }, [setLoading, ref, snap])

   useEffect(() => {
      const { current } = ref
      const listener = debounce((e: WheelEvent) => {
         if (e.deltaY < 0 || !current) return

         const total = current.scrollHeight - current.offsetHeight

         if (current.scrollTop >= (total - (space * current.offsetHeight))) {
            setLoading(l => {
               if (!l) Promise.resolve(hitBottom()).then(scrollDown)
               return true
            })
         }
      }, 100)

      current?.addEventListener('wheel', listener)
      return () => current?.addEventListener('wheel', listener)
   }, [hitBottom, ref, scrollDown, space])

}

export const ScrollProvider = CONTEXT.Provider