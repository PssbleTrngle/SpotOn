import { Document, Schema } from 'mongoose'
import { Session } from 'next-auth'
import slugify from 'slugify'
import Track from '../interfaces/Track'
import { define } from '../lib/database'
import { getSavedTracks } from '../lib/spotify'
import { getOperation } from './Operations'

export interface IBaseRule<V = unknown> {
   id?: string
   type: string
   value?: V
   display?: string
   children?: IBaseRule[]
}

export interface IChildRule<T = unknown, V = unknown, C = unknown> extends IBaseRule<V> {
   id: string
   children?: IChildRule<C>[]
}

export interface IRule<T = unknown, V = unknown, C = unknown> extends IChildRule<T, V, C> {
   name: string
   slug: string
   user: string
   playlist?: string
   tracks(session: Session): Promise<Track[]>
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

export async function applyRule<T, V>(rule: IChildRule<T, V>, track: Track, session: Session): Promise<T> {
   return getOperation<T, V>(rule.type).apply(track, rule, session)
}

schema.methods.tracks = async function (session: Session) {
   const { items } = await getSavedTracks(session)

   const tracks = await Promise.all(
      items.map(async ({ track }) => ({
         track,
         valid: (await applyRule(this, track, session)) === true,
      }))
   )

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
