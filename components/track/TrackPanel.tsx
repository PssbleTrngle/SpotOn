import { FC, MouseEventHandler } from 'react'
import styled from 'styled-components'
import Track from '../../interfaces/Track'
import Image from '../Image'

const TrackPanel: FC<
   Track & {
      selected?: boolean
      onClick?: MouseEventHandler
   }
> = ({ name, album, selected, ...events }) => {
   const [image] = album.images

   return (
      <Style selected={selected} {...events}>
         <Image src={image?.url} alt={name} />
      </Style>
   )
}

const Style = styled.li<{ selected?: boolean }>`
   user-select: none;
`

export default TrackPanel
