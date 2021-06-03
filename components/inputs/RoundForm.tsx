import styled from "@emotion/styled";
import { BorderLeft, BorderRight } from "../styles/Border";

const RoundForm = styled.form`
   display: grid;
   grid-auto-flow: column;
   gap: 0.3rem;
   justify-content: center;

   & > input, label, button {
      border-radius: 0;

      &:first-child {
         ${BorderLeft};
      }
      &:last-child {
         ${BorderRight};
      }
   }
`

export  default RoundForm