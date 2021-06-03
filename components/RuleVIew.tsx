import styled from "@emotion/styled";
import { FC, Fragment } from "react";
import { IChildRule } from "../models/Rule";

const RuleView: FC<IChildRule> = ({ type, children, value }) => (
   <Bubble>
      {value && <span>{value as any}</span>}
      {children?.map((child, i) =>
         <Fragment key={child.id}>
            {i > 0 && <span>{type}</span>}
            <RuleView  {...child} />
         </Fragment>
      )}
   </Bubble>
)

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