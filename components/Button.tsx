import styled from "@emotion/styled";
import { lighten, transparentize } from "polished";

const Button = styled.button`
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

export default Button