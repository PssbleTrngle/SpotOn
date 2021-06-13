import Joi from 'joi'
import { Session } from 'next-auth'
import Track from '../../interfaces/Track'
import { applyRule, IChildRule } from '../Rule'
import { RuleError } from '../RuleError'
import Operation from './Operation'

export default abstract class GroupOperation<T, C> extends Operation<T, never> {
   valueType() {
      return Joi.allow(null).optional()
   }

   constructor(public readonly min = 2, public readonly max = Number.MAX_SAFE_INTEGER) {
      super()
   }

   abstract childType(): Joi.Schema

   async apply(track: Track, { children }: IChildRule<T, never, C>, session: Session) {
      const values = await Promise.all((children ?? []).map(r => applyRule(r, track, session)))
      return this.merge(values)
   }

   abstract merge(children: C[]): T

   async valid({ children }: IChildRule<T, never, C>) {
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
