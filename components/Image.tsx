import { FC, ImgHTMLAttributes } from 'react'
import styled from 'styled-components'

const Image: FC<ImgHTMLAttributes<HTMLImageElement>> = ({ src, ...props }) => <Style src={src ?? ''} {...props} />

const Style = styled.img<{ src: string }>`
   width: 100%;
   object-fit: contain;
   position: relative;
`
export default Image
