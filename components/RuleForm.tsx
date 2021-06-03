import styled from "@emotion/styled"
import { shuffle } from "lodash"
import { Dispatch, FC, SetStateAction, useCallback, useMemo, useState } from "react"
import { IBaseRule } from "../models/Rule"
import Select from "./inputs/Select"
import RuleView from "./RuleView"

export const exampleRule = (): IBaseRule => ({
   type: shuffle(['and', 'or'])[0],
   children: new Array(2).fill(null).map(() => ({
      type: shuffle(['tag', 'playlist'])[0],
   }))
})

function recurseRule(rule: IBaseRule, path: number[]): IBaseRule {
   if (path.length <= 0) return rule
   const [first, ...rest] = path
   if (!rule.children || rule.children.length <= first) return rule
   return recurseRule(rule.children?.[first], rest)
}

const TYPES = {
   tag: 'Has Tag',
   playlist: 'In Playlist',
}

const RuleForm: FC<{
   value: IBaseRule
   onChange: Dispatch<SetStateAction<IBaseRule>>
}> = ({ value, onChange }) => {

   const [path, setPath] = useState<number[]>([0, 1])
   const selected = useMemo(() => path && recurseRule(value, path), [path, value])

   const modifyRecursive = useCallback((rule: IBaseRule, value: Partial<IBaseRule>, p: number[]): IBaseRule => {
      if (p.length === 0) return { ...rule, ...value }
      const [first, ...rest] = p
      if (!rule.children || rule.children.length <= first) return rule
      return {
         ...rule, children: rule.children.map((c, i) => {
            if (i === first) return modifyRecursive(rule, value, rest)
            else return c
         })
      }
   }, [onChange])

   const modify = useCallback((value: Partial<IBaseRule>) => {
      if (path) onChange(modifyRecursive(selected, value, path))
   }, [modifyRecursive, path, selected])

   return <Style>
      <RuleView {...value} onSelect={setPath} />
      {path !== undefined &&
         <EditPanel value={selected} onChange={modify} />
      }
   </Style>
}

const EditPanel: FC<{
   value: IBaseRule
   onChange: Dispatch<Partial<IBaseRule>>
}> = ({ value, onChange }) => (
   <div>
      <label>Type</label>
      <Select value={value.type} onChange={e => onChange({ type: e.target.value })}>
         {Object.entries(TYPES).map(([key, display]) =>
            <option key={key} value={key}>{display}</option>
         )}
      </Select>
   </div>
)

const Style = styled.div`
   grid-area: rule;
   margin: 0 auto;

   display: grid;
   gap: 2rem;
`

export default RuleForm