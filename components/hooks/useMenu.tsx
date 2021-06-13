import { createContext, Dispatch, FC, SetStateAction, useCallback, useContext, useEffect, useState } from 'react'
import Menu from '../Menu'

export type Option = Action | Options

export interface Options {
   title: string
   [key: string]: Option | string
}

export interface Action {
   (): unknown | Promise<unknown>
}

type State<T> = [T, Dispatch<SetStateAction<T>>]

type Menu = {
   point: [number, number]
   options: Options
}

const CONTEXT = createContext<State<Menu | null>>([null, () => console.warn('MenuProvider missing')])

export function useMenu() {
   const [, setMenu] = useContext(CONTEXT)

   const close = useCallback(() => setMenu(null), [setMenu])
   const open = useCallback(
      (options: Options) => (e: React.MouseEvent<HTMLElement>) => {
         e.preventDefault()
         setMenu({ options, point: [e.clientX, e.clientY] })
      },
      [setMenu]
   )

   return { open, close }
}

export const MenuProvider: FC = ({ children }) => {
   const [menu, setMenu] = useState<Menu | null>(null)

   useEffect(() => {
      const listener = (e: KeyboardEvent) => {
         if (e.key === 'Escape') setMenu(null)
      }

      window.addEventListener('keyup', listener)
      return () => window.removeEventListener('keyup', listener)
   }, [])

   return (
      <CONTEXT.Provider value={[menu, setMenu]}>
         {menu && <Menu {...menu} />}
         <section onClick={() => setMenu(null)}>{children}</section>
      </CONTEXT.Provider>
   )
}
