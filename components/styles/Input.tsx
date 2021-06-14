import { darken, transparentize } from 'polished'
import { css } from 'styled-components'

const Input = css`
   background: ${p => darken(0.1, p.theme.bg)};
   padding: 0.8rem 1rem;

   outline: none;
   border: none;

   color: ${p => p.theme.text};

   &:focus {
      box-shadow: 0 0 0 0.1rem ${p => p.theme.primary}, 0 0 0 0.3rem ${p => transparentize(0.8, p.theme.primary)};
   }
`

export default Input
