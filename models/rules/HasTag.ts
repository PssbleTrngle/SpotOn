import Joi from "joi";
import { Session } from "next-auth";
import Track from "../../interfaces/Track";
import { IChildRule } from "../Rule";
import Tag from "../Tag";
import Operation, { RuleError } from "./Operation";

export default class HasTag extends Operation<boolean, string> {

   valueType() {
      return Joi.string()
   }

   apply(track: Track, { value }: IChildRule<boolean, string>) {
      return !!track.tags?.find(t => value === t.id)
   }

   async valid({ value }: IChildRule<boolean, string>, session: Session) {
      const exists = await Tag.findOne({ _id: value, user: session.user.id })
      if (!exists) throw new RuleError('Tag not found')
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