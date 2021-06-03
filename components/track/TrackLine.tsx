import styled from "@emotion/styled";
import { FC, MouseEventHandler } from "react";
import Track from "../../interfaces/Track";
import Image from "../Image";
import TagLabel from "../TagLabel";

const TrackLine: FC<Track & {
   selected?: boolean
   onClick?: MouseEventHandler
   onContextMenu?: MouseEventHandler
}> = ({ name, album, tags, selected, ...events }) => {
   const [image] = album.images
   return (
      <Style selected={selected} {...events}>
         <Image src={image?.url} />
         <h3>{name}</h3>
         <div>
            {tags?.map(tag =>
               <TagLabel key={tag.id} {...tag} />
            )}
         </div>
      </Style>
   )
}

const Style = styled.li<{ selected?: boolean }>`
   padding: 0.5rem;
   user-select: none;

   display: grid;
   grid-template-columns: 120px 1fr 1fr;
   align-items: center;
   justify-content: space-around;
   gap: 1rem;

   transition: background 0.1s ease;
   background: ${p => p.selected ? '#FFF1' : 'transparent'};

   &:hover {
      background: #FFF2;
   }

   img {
      height: 120px;
   }
`

export default TrackLine