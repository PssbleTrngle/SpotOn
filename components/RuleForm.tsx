import { AxiosError } from 'axios'
import { transparentize } from 'polished'
import { Dispatch, FC, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'
import useSWR from 'swr'
import { IBaseRule } from '../models/Rule'
import { IOperation } from '../models/rules/Operation'
import { request } from './hooks/useSubmit'
import Selection from './inputs/Selection'
import RuleView from './RuleView'

function recurseRule(rule: IBaseRule, path: number[]): IBaseRule {
   if (path.length <= 0) return rule
   const [first, ...rest] = path
   if (!rule.children || rule.children.length <= first) return rule
   return recurseRule(rule.children?.[first], rest)
}

export interface RuleError {
   message: string
   path: number[]
}

const RuleForm: FC<{
   value: IBaseRule
   onChange: Dispatch<SetStateAction<IBaseRule>>
   onError?: Dispatch<RuleError[] | undefined>
}> = ({ value, onChange, onError }) => {
   const { data: operations } = useSWR<IOperation[]>('/api/rule/operations')
   const [errors, setErrors] = useState<RuleError[]>()

   useEffect(() => {
      request
         .post<RuleError[]>('rule/validate', value)
         .then(() => setErrors(undefined))
         .catch((r: AxiosError) => setErrors(r.response?.data))
   }, [value])

   useEffect(() => {
      onError?.(errors)
   }, [errors, onError])

   const [path, setPath] = useState<number[]>()
   const selected = useMemo(() => path && recurseRule(value, path), [path, value])

   const modifyRecursive = useCallback((rule: IBaseRule, value: SetStateAction<Partial<IBaseRule>>, p: number[]): IBaseRule => {
      if (p.length === 0) {
         const partial = typeof value === 'function' ? value(rule) : value
         return { ...rule, ...partial }
      }

      const [first, ...rest] = p
      if (!rule.children || rule.children.length <= first) return rule

      return {
         ...rule,
         children: rule.children.map((c, i) => {
            if (i === first) return modifyRecursive(c, value, rest)
            else return c
         }),
      }
   }, [])

   const modify = useCallback(
      (change: SetStateAction<Partial<IBaseRule>>) => {
         if (path && selected) onChange(modifyRecursive(value, change, path))
      },
      [modifyRecursive, path, value, onChange, selected]
   )

   const add = useCallback(
      (path: number[]) => {
         onChange(
            modifyRecursive(
               value,
               r => {
                  const children = [...(r.children ?? []), { type: '', display: 'Select...' }]
                  setPath([...path, children.length - 1])
                  return { children }
               },
               path
            )
         )
      },
      [modifyRecursive, onChange, value]
   )

   return (
      <Style>
         {!!errors?.length && <Error>{errors[0]?.message}</Error>}
         <RuleView onAdd={add} {...value} onSelect={setPath} selected={path} errors={errors} />
         {selected && operations && <EditPanel value={selected} onChange={modify} operations={operations} />}
      </Style>
   )
}

const Error = styled.p`
   border: dashed 1px ${p => p.theme.error};
   background: ${p => transparentize(0.8, p.theme.error)};
   padding: 1rem 3rem;
   border-radius: 1rem;
   text-align: center;
   max-width: 500px;
   margin: 0 auto;
`

const EditPanel: FC<{
   value: IBaseRule
   onChange: Dispatch<SetStateAction<Partial<IBaseRule>>>
   operations: IOperation<any>[]
}> = ({ value, onChange, operations }) => {
   const operation = useMemo(() => operations.find(o => o.name === value.type), [operations, value])

   const stripValues = useCallback(
      (type: string) => {
         const composite = operations.some(o => o.isGroup && o.name === type)
         return {
            children: composite ? value.children ?? [] : undefined,
            composite,
            value: undefined,
            display: undefined,
         }
      },
      [operations, value]
   )

   return (
      <FormStyle>
         <Selection label='type' values={operations.map(o => ({ value: o.name, ...o }))} onChange={({ value }) => onChange({ type: value, ...stripValues(value) })} value={value.type} />

         {operation && (operation.isGroup || <Selection label='value' values={operation.values} onChange={onChange} value={value.value} />)}
      </FormStyle>
   )
}

const FormStyle = styled.div`
   display: grid;
   grid-template-rows: auto 1fr;
   grid-template-columns: repeat(2, 500px);
   grid-auto-flow: column;
   gap: 1rem;
   justify-content: center;
`

const Style = styled.div`
   grid-area: rule;
   margin: 0 auto;

   display: grid;
   gap: 2rem;

   & > div {
      margin: 0 auto;
   }
`

export default RuleForm
