import { css, Theme } from "@emotion/react";
import { darken, transparentize } from "polished";

const Input = (p: { theme: Theme }) => css`
   background: ${darken(0.1, p.theme.bg)};
   padding: 0.8rem 1rem;

   outline: none;
   border: none;

   color: ${p.theme.text};

   &:focus {
      box-shadow: 
         0 0 0 0.1rem ${p.theme.primary},
         0 0 0 0.3rem ${transparentize(0.8, p.theme.primary)};
   }
`


export default Input