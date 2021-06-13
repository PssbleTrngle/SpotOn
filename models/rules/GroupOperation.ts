import Joi from 'joi'
import { Session } from 'next-auth'
import Track from '../../interfaces/Track'
import { applyRule, IChildRule } from '../Rule'
import { RuleError } from '../RuleError'
import Operation from './Operation'

export default abstract class GroupOperation<Out, ChildOut> extends Operation<Out, never> {
   valueType() {
      return Joi.allow(null).optional()
   }

   constructor(public readonly min = 2, public readonly max = Number.MAX_SAFE_INTEGER) {
      super()
   }

   abstract childType(): Joi.Schema

   async apply(track: Track, { children }: IChildRule<unknown>, session: Session) {
      const values = await Promise.all((children ?? []).map(r => applyRule<ChildOut, unknown>(r, track, session)))
      return this.merge(values)
   }

   abstract merge(children: ChildOut[]): Out

   async valid({ children }: IChildRule<never, ChildOut>) {
      if (!children || children.length < this.min) throw new RuleError('Not enough children')
      if (children.length > this.max) throw new RuleError('Too many children')
   }

   values() {
      return []
   }

   valueDisplay(): string {
      throw new Error('Group rule should not have a value')
   }
}
