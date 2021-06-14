import { darken, transparentize } from 'polished'
import React, { Dispatch, FC, Fragment, useCallback, useMemo } from 'react'
import styled, { css } from 'styled-components'
import { IBaseRule } from '../models/Rule'
import useTooltip from './hooks/useTooltip'
import { RuleError } from './RuleForm'

const RuleView: FC<
   IBaseRule & {
      onSelect?: Dispatch<number[]>
      selected?: number[]
      errors?: RuleError[]
      level?: number
      onAdd?: Dispatch<number[]>
   }
> = ({ type, children, display, composite, onAdd, onSelect, value, id = 'create', selected, errors = [], level = 0 }) => {
   const tooltip = useTooltip(`rule-${id}`)

   const messages = useMemo(
      () =>
         errors
            .filter(e => e.path.length === 0)
            .map(e => e.message)
            .join(', ') || undefined,
      [errors]
   )

   const click = useCallback(
      (e: React.MouseEvent) => {
         e.stopPropagation()
         onSelect?.([])
      },
      [onSelect]
   )

   const add = useCallback(
      (e: React.MouseEvent) => {
         e.stopPropagation()
         onAdd?.([])
      },
      [onAdd]
   )

   const nextPath = useCallback((index: number, [first, ...path]: number[] = []) => {
      if (first === index) return path
      return undefined
   }, [])

   const nextErrors = useCallback((index: number) => errors.map(e => ({ ...e, path: nextPath(index, e.path) })).filter(e => e.path) as RuleError[], [errors, nextPath])

   return (
      <Bubble data-tip={messages ?? type} data-for={`rule-${id}`} level={level} selected={selected?.length === 0} error={!!messages} onClick={click}>
         {tooltip}

         {!composite && (value || display ? <span>{display ?? (value as any).toString()}</span> : <Type>{type}</Type>)}

         {children?.map((child, i) => (
            <Fragment key={child.id ?? i}>
               {i > 0 && <span>{display ?? type}</span>}

               <RuleView {...child} level={level + 1} selected={nextPath(i, selected)} errors={nextErrors(i)} onSelect={p => onSelect?.([i, ...p])} onAdd={onAdd && (p => onAdd([i, ...p]))} />
            </Fragment>
         ))}

         {composite && onAdd && <Add onClick={add}>+</Add>}
      </Bubble>
   )
}

const Add = styled.span``

const Type = styled.span`
   font-style: italic;
   color: ${p => transparentize(0.2, p.theme.text)};
`

const Bubble = styled.div<{ selected?: boolean; error?: boolean; level: number }>`
   width: max-content;
   padding: 1rem 1.5rem;
   background: ${p => darken(0.03 * (p.level + 1), p.theme.bg)};
   border-radius: 9999px;
   cursor: pointer;

   display: grid;
   grid-auto-flow: column;
   gap: 0.8rem;
   align-items: center;

   box-shadow: 0 0 0 0 ${p => p.theme.primary};
   transition: box-shadow 0.1s ease, background 0.1s ease;

   &:hover {
      box-shadow: 0 0 0 1px ${p => p.theme.primary};
   }

   ${p =>
      p.error &&
      css`
         box-shadow: 0 0 0 3px ${p.theme.error} !important;
      `}

   ${p =>
      p.selected &&
      css`
         background: ${transparentize(0.5, p.theme.primary)};
      `}

   span {
      text-transform: lowercase;
   }
`

export default RuleView
