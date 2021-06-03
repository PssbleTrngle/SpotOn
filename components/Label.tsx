import styled from "@emotion/styled";

function getBrighness(color: string) {
   const code = color.startsWith('#') ? color.substring(1) : color
   const [r1, r2, g1, g2, b1, b2] = code.split('');
   const full = code.length < 4
      ? [[r1, r1], [r2, r2], [g1, g1]]
      : [[r1, r2], [g1, g2], [b1, b2]]

   const [r, g, b] = full
      .map(a => a.join(''))
      .map(s => Number.parseInt(s, 16))
   return r + g + b;
}

const Label = styled.a<{ color: string, size?: number }>`
   background: #${p => p.color};
   padding: ${p => (p.size ?? 1) * 0.4}rem ${p => (p.size ?? 1) * 0.7}rem;
   margin: 0 ${p => (p.size ?? 1) * 0.2}rem;
   border-radius: 9999px;
   color: ${p => getBrighness(p.color) > 284 ? '#000' : '#FFF'};
   text-decoration: none;
   font-size: ${p => (p.size ?? 1)}rem;
`

export default Label