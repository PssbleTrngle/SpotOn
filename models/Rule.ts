import { Document, Schema } from "mongoose";
import slugify from "slugify";
import Track from "../interfaces/Track";
import { define } from "../lib/database";
import Add from "./rules/And";
import HasTag from "./rules/HasTag";
import Operation from "./rules/Operation";
import Or from "./rules/Or";

const operations = new Map<string, Operation<unknown, unknown>>();
[Add, Or, HasTag].forEach(o => operations.set(o.name, new o()))

export interface IBaseRule<V = unknown> {
   id?: string
   type: string
   value?: V
   children?: IBaseRule[]
}

export interface IChildRule<T = unknown, V = unknown, C = unknown> extends IBaseRule {
   id: string
   test(track: Track): boolean
   apply(track: Track): T
   operation(): Operation<T, V>
   children?: IChildRule<C>[]
}

export interface IRule<T = unknown, V = unknown, C = unknown> extends IChildRule<T, V, C> {
   name: string
   slug: string
   user: string
}

const schema = new Schema<Document & IRule>({
   type: {
      type: String,
      required: true,
   },
   value: {
      type: Object,
   }
})

schema.methods.apply = function (track: Track) {
   const operation = this.operation()
   if (operation.valueType().validate(this.value).error) throw new Error('Invalid Rule')
   return operation.apply(track, this)
}

schema.methods.test = function (track: Track) {
   return !!this.apply(track)
}

schema.methods.operation = function () {
   const operation = operations.get(this.type)
   if (!operation) throw new Error('Invalid Rule')
   return operation
}

const sub = schema.clone()

schema.add({
   children: [sub],
   name: {
      type: String,
      required: true,
      maxlength: 30,
      unique: true,
   },
   slug: {
      type: String,
      unique: true,
   },
   user: {
      type: String,
      required: true,
   },
   playlist: {
      type: String,
      unique: true,
   },
})

schema.pre('save', async function (this: IRule) {
   this.slug = slugify(this.name, { lower: true })
})

export default define<IRule>('Rule', schema)