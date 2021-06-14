import { FC } from 'react'
import { ITag } from '../models/Tag'
import Label from './Label'

const TagLabel: FC<
   ITag<unknown> & {
      size?: number
   }
> = ({ id, slug, color, name, ...props }) => (
   <Label {...props} title={id} href={`/tags/${slug}`} color={`#${color ?? '000'}`}>
      {name}
   </Label>
)

export default TagLabel
