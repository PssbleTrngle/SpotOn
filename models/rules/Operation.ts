import Joi from "joi"
import Track from "../../interfaces/Track"
import { IChildRule } from "../Rule"

export default abstract class Operation<T, V> {

   abstract apply(track: Track, rule: IChildRule<T,V>): T

   abstract valueType(): Joi.Schema

   async valid(_rule: IChildRule<T,V>) {
      return true
   }

   name!: string

}