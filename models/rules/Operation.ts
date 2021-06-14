import Joi from 'joi'
import { Session } from 'next-auth'
import Track from '../../interfaces/Track'
import { IChildRule } from '../Rule'

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

export default abstract class Operation<Out, In> {
   abstract apply(track: Track, rule: IChildRule<In>, session: Session): Out | Promise<Out>

   abstract valueType(): Joi.Schema | null

   async valid(_rule: IChildRule<In>, _session: Session) {}

   abstract values(session: Session): IValue<In>[] | Promise<IValue<In>[]>

   abstract valueDisplay(value: In, session: Session): string | Promise<string>
}
