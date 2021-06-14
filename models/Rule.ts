import { Document, Schema } from 'mongoose'
import { Session } from 'next-auth'
import slugify from 'slugify'
import Track from '../interfaces/Track'
import { define } from '../lib/database'
import { getSavedTracks } from '../lib/spotify'
import { getOperation } from './Operations'
import GroupOperation from './rules/GroupOperation'

export interface IBaseRule<V = unknown> {
   id?: string
   type: string
   value?: V
   display?: string
   children?: IBaseRule[]
   composite?: boolean
}

export interface IChildRule<V = unknown, C = unknown> extends IBaseRule<V> {
   children?: IChildRule<C>[]
}

export interface IRule<V = unknown, C = unknown> extends IChildRule<V, C> {
   id: string
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

export async function applyRule<Out, In>(rule: IChildRule<In>, track: Track, session: Session): Promise<Out> {
   return getOperation<Out, In>(rule.type).apply(track, rule, session)
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

schema.virtual('composite').get(function (this: IBaseRule) {
   return getOperation(this.type) instanceof GroupOperation
})

const sub = schema.clone()
sub.add({ children: [sub] })

schema.add({
   children: { type: [sub] },
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
      sparse: true,
   },
})

schema.pre('save', async function (this: IRule) {
   this.slug = slugify(this.name, { lower: true })
})

export default define<IRule>('Rule', schema)
