import { Document, Schema } from "mongoose";
import { Session } from 'next-auth';
import slugify from "slugify";
import Track from "../interfaces/Track";
import { define } from "../lib/database";
import { getSavedTracks } from "../lib/spotify";
import { getOperation } from "./Operations";
import Operation from "./rules/Operation";

export interface IBaseRule<V = unknown> {
   id?: string
   type: string
   value?: V
   display?: string
   children?: IBaseRule[]
}

export interface IChildRule<T = unknown, V = unknown, C = unknown> extends IBaseRule<V> {
   id: string
   test(track: Track, session: Session): Promise<boolean>
   apply(track: Track, session: Session): Promise<T>
   tracks(session: Session): Promise<Track>
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
   },
   display: {
      type: String,
   },
})

schema.methods.apply = function (track: Track, session: Session) {
   const operation = this.operation()
   if (operation.valueType().validate(this.value).error) throw new Error('Invalid Rule')
   return operation.apply(track, this, session)
}

schema.methods.test = function (track: Track, session: Session) {
   return !!this.apply(track, session)
}

schema.methods.operation = function () {
   return getOperation(this.type)
}

schema.methods.tracks = async function (session: Session) {
   const { items } = await getSavedTracks(session)

   const tracks = await Promise.all(items.map(({ track }) => ({
      track, valid: this.test(track, session),
   })))

   return tracks.filter(t => t.valid).map(t => t.track)
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