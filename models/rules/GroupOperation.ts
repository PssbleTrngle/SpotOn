import Joi from "joi";
import Track from "../../interfaces/Track";
import { IChildRule } from "../Rule";
import Operation from "./Operation";

export default abstract class GroupOperation<T, C> extends Operation<T, never> {

   valueType() {
      return Joi.allow(null).optional()
   }

   constructor(private min = 2, private max = Number.MAX_SAFE_INTEGER) {
      super();
   }

   abstract childType(): Joi.Schema

   apply(track: Track, { children }: IChildRule<T, never, C>) {
      const values = (children ?? []).map(r => r.apply(track))
      if (values.some(v => this.childType().validate(v).error)) throw new Error('Invalid Rule')
      return this.merge(values)
   }

   abstract merge(children: C[]): T

   async valid({ children }: IChildRule<T, never, C>) {
      return !!children
         && await Promise.all(children.map(c => c.operation().valid(c))).then(a => a.every(b => b))
         && children?.length >= this.min && children.length <= this.max
   }

}