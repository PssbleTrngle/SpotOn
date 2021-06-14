import styled from 'styled-components'

const Grid = styled.ul`
   display: grid;
   grid-template-columns: repeat(8, 1fr);
   gap: 0.5rem;
   padding: 0.5rem;
   height: max-content;
   grid-area: tracks;

   li {
      text-align: center;

      img {
         aspect-ratio: 1/1;
         object-fit: cover;
      }
   }
`

export default Grid
