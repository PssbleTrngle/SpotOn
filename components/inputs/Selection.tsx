import { darken, lighten } from 'polished'
import { Dispatch } from 'react'
import styled, { css } from 'styled-components'
import { IValue } from '../../models/rules/Operation'

function Selection<V = string>({ value, onChange, values, label }: { label?: string; value: V; onChange: Dispatch<IValue<V>>; values: IValue<V>[] }) {
   return (
      <>
         <Label htmlFor={label}>{label}</Label>
         <Values id={label}>
            {values.map(v => (
               <Value onClick={() => onChange(v)} selected={value === v.value} key={(v.value as any).toString()}>
                  {v.display}
               </Value>
            ))}
         </Values>
      </>
   )
}

const Label = styled.label`
   text-transform: capitalize;
   padding-left: 0.5rem;
`

const Values = styled.ul`
   border-radius: 10px;
   overflow: hidden;
   height: min-content;
`

const Value = styled.li<{ selected: boolean }>`
   padding: 0.5rem;

   transition: background 0.1s linear;
   background: ${p => darken(0.1, p.theme.bg)};
   cursor: pointer;

   &:nth-of-type(odd) {
      background: ${p => darken(0.15, p.theme.bg)};
   }

   &:hover {
      background: ${p => lighten(0.05, p.theme.bg)};
   }

   ${p =>
      p.selected &&
      css`
         background: ${p.theme.primary} !important;
      `}
`

export default Selection
