import styled from "@emotion/styled";
import { transparentize } from "polished";
import { Dispatch, FC, Fragment } from "react";
import { IBaseRule } from "../models/Rule";

const RuleView: FC<IBaseRule & {
   onSelect?: Dispatch<number[]>
}> = ({ type, children, value, onSelect }) => (
   <Bubble onClick={e => {
      e.stopPropagation()
      onSelect?.([])
   }}>
      {!children && (value 
         ? <span>{(value as any)?.toString()}</span>
         : <Type>{type}</Type>
      )}
      {children?.map((child, i) =>
         <Fragment key={child.id ?? i}>
            {i > 0 && <span>{type}</span>}
            <RuleView {...child} onSelect={p => onSelect?.([...p, i])} />
         </Fragment>
      )}
   </Bubble>
)

const Type = styled.span`
   font-style: italic;
   color: ${p => transparentize(0.2, p.theme.text)};
`

const Bubble = styled.div`
   width: min-content;
   padding: 1rem 1.5rem;
   background: #0002;
   border-radius: 9999px;

   display: grid;
   grid-auto-flow: column;
   gap: 0.8rem;
   align-items: center;
   
   box-shadow: 0 0 0 0 ${p => p.theme.primary};
   transition: box-shadow 0.1s ease;

   &:hover {
      box-shadow: 0 0 0 1px ${p => p.theme.primary};
   }

   span {
      text-transform: lowercase;
   }
`

export default RuleView