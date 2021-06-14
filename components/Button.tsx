import { lighten, transparentize } from 'polished'
import styled, { css } from 'styled-components'

export const ButtonStyle = css`
   background: ${p => p.theme.primary};
   border-radius: 9999px;
   padding: 0.8rem 1.6rem;

   transition: background 0.1s ease;
   &:hover {
      background: ${p => lighten(0.1, p.theme.primary)};
   }

   &:disabled {
      background: ${p => lighten(0.2, p.theme.bg)};
      color: ${p => transparentize(0.2, p.theme.text)};
      cursor: not-allowed;
   }
`

const Button = styled.button`
   ${ButtonStyle};
`

export const LinkButton = styled.a.attrs({
   target: '_blank',
   rel: 'noopener noreferrer',
})`
   ${ButtonStyle};
   text-decoration: none;
   color: ${p => p.theme.text};
`

export default Button
