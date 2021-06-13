import { uniq } from 'lodash'
import React, { useCallback, useState } from 'react'
import { Options, useMenu } from './useMenu'

export default function useSelection<M, ID>(models: M[], getId: (m: M) => ID, menu: (selected: ID[]) => Options) {
   const { open } = useMenu()
   const [selected, setSelected] = useState<ID[]>([])
   const [, setLast] = useState<ID>()

   const events = useCallback(
      (model: M) => {
         const id = getId(model)
         const index = models.indexOf(model)

         return {
            onClick(e: React.MouseEvent) {
               setLast(last => {
                  setSelected(selected => {
                     if (e.ctrlKey) {
                        if (selected.includes(id)) return selected.filter(i => i !== id)
                        else return [...selected, id]
                     } else if (e.shiftKey) {
                        e.preventDefault()
                        const lastIndex = models.findIndex(m => getId(m) === last)
                        const between = models.slice(Math.min(index, lastIndex), Math.max(index, lastIndex))
                        return uniq([...selected, ...between.map(m => getId(m)), id])
                     }

                     if (selected.length === 1 && selected[0] === id) return []
                     else return [id]
                  })

                  return id
               })
            },

            onContextMenu(e: React.MouseEvent<HTMLElement>) {
               const s = selected.includes(id) ? selected : [id]
               setSelected(s)
               open(menu(s))(e)
            },
         }
      },
      [setSelected, menu, getId, open, models, setLast, selected]
   )

   const isSelected = useCallback((model: M) => selected.includes(getId(model)), [selected, getId])

   return { events, isSelected }
}
