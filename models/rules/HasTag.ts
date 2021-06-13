import Joi from 'joi'
import { Session } from 'next-auth'
import Track from '../../interfaces/Track'
import { IChildRule } from '../Rule'
import { RuleError } from '../RuleError'
import Tag from '../Tag'
import Operation from './Operation'

export default class HasTag extends Operation<boolean, string> {
   valueType() {
      return Joi.string()
   }

   apply(track: Track, { value }: IChildRule<string>) {
      return !!track.tags?.find(t => value === t.id)
   }

   async valid({ value }: IChildRule<string>, session: Session) {
      try {
         const exists = await Tag.findOne({ _id: value, user: session.user.id })
         if (!exists) throw new Error('Tag not found')
      } catch (e) {
         throw new RuleError(e.message)
      }
   }

   async values(session: Session) {
      const tags = await Tag.find({ user: session.user.id })
      return tags.map(t => ({ value: t.id, display: t.name }))
   }

   async valueDisplay(value: string) {
      const tag = await Tag.findById(value)
      if (!tag) throw new Error('Invalid Rule')
      return tag.name
   }
}
