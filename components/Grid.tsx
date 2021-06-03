import styled from "@emotion/styled"

const Grid = styled.ul`
   display: grid;
   grid-template-columns: repeat(8, 1fr);
   gap: 0.5rem;
   padding: 0.5rem;

   li {
      text-align: center;

      img {
         aspect-ratio: 1/1;
         object-fit: cover;
      }
   }
`

export default Grid