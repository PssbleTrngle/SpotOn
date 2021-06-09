import Joi from "joi"
import { Session } from "next-auth"
import Track from "../../interfaces/Track"
import { IChildRule } from "../Rule"

export class RuleError extends Error {
   constructor(public readonly message: string, public readonly path: number[] = []) {
      super(message)
   }
}

export interface IOperation<V = unknown> {
   name: string
   display: string
   isGroup: boolean
   values: IValue<V>[]
}

export interface IValue<V = unknown> {
   value: V
   display: string
}

export default abstract class Operation<T, V> {

   abstract apply(track: Track, rule: IChildRule<T,V>, session: Session): T | Promise<T>

   abstract valueType(): Joi.Schema

   async valid(_rule: IChildRule<T,V>, _session: Session) {}

   abstract values(session: Session): IValue<V>[] | Promise<IValue<V>[]>

   abstract valueDisplay(value: V, session: Session): string | Promise<string>

}