import { hsl, parseToHsl } from 'polished'
import styled from 'styled-components'

function contrast(color: string) {
   const { hue, lightness, saturation } = parseToHsl(color)
   return hsl({
      hue,
      saturation,
      lightness: lightness > 0.5 ? 0 : 1,
   })
}

const Label = styled.a.attrs({ rel: 'noopener noreferrer' })<{ color: string; size?: number }>`
   background: ${p => p.color};
   padding: ${p => (p.size ?? 1) * 0.4}rem ${p => p.size ?? 1}rem;
   margin: 0 ${p => (p.size ?? 1) * 0.2}rem;
   border-radius: 9999px;
   color: ${p => contrast(p.color)};
   text-decoration: none;
   font-size: ${p => p.size ?? 1}rem;

   display: inline-grid;
   align-items: center;
   width: max-content;
   grid-auto-flow: column;
   gap: 0.5rem;
`

export default Label
