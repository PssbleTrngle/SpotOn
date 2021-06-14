import { ArrowCircleLeft } from '@styled-icons/fa-solid'
import { darken } from 'polished'
import { FC, useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'
import { Options, useMenu } from './hooks/useMenu'

const Menu: FC<{
   options: Options
   point: [number, number]
}> = ({ options, point }) => {
   const [selected, setSelected] = useState<string[]>([])
   const { close } = useMenu()

   useEffect(() => {
      setSelected([])
   }, [options])

   const { title, ...visible } = useMemo(() => {
      const find = (keys: string[], o = options): Options => (keys.length === 0 ? o : find(keys.slice(1), (o as any)[keys[0]]))
      if (selected.length) return find(selected)
      return options
   }, [options, selected])
   const [x, y] = point

   return (
      <Container x={x} y={y}>
         <ul>
            <p>
               {selected.length > 0 && (
                  <button onClick={() => setSelected([])}>
                     <ArrowCircleLeft size='1rem' />
                  </button>
               )}
               {title ?? selected[selected.length - 1]}
            </p>
            {Object.entries(visible).map(([key, option]) => (
               <button
                  key={key}
                  name={key}
                  onClick={() => {
                     if (typeof option === 'function') Promise.resolve(option()).then(close)
                     else if (Object.keys(option).length > 0) setSelected(s => [...s, key])
                  }}>
                  {key}
               </button>
            ))}
         </ul>
      </Container>
   )
}

const Container = styled.div<{ x: number; y: number }>`
   position: absolute;
   z-index: 999;

   left: ${p => p.x}px;
   top: ${p => p.y}px;

   border-radius: 1rem;
   overflow: hidden;

   min-width: 300px;

   p {
      font-style: italic;
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 1rem;
   }

   button {
      text-align: left;
   }

   ul > * {
      width: 100%;
      padding: 1rem 1.5rem;
      transition: background 0.1s ease;
      background: ${p => darken(0.1, p.theme.bg)};

      &:hover {
         background: ${p => darken(0.05, p.theme.bg)};
      }
   }
`

export default Menu
