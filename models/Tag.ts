import { Schema } from "mongoose";
import slugify from "slugify";
import { randomColor } from "../lib/colors";
import { define } from "../lib/database";

export interface ITag<T = string> {
   id: string
   user: string
   name: string
   slug: string
   color: string
   tracks: T[]
   importedFrom?: string
}

const schema = new Schema({
   user: {
      type: String,
      required: true,
   },
   name: {
      type: String,
      required: true,
      maxlength: 10,
      lowercase: true,
   },
   slug: {
      type: String,
   },
   color: {
      type: String,
      required: true,
      length: 6,
      default: randomColor
   },
   tracks: [{
      type: String,
      default: () => [],
   }],
   importedFrom: {
      type: String
   }
})

schema.index({ name: 1, user: -1 }, { unique: true })

schema.pre('save', async function (this: ITag) {
   this.slug = slugify(this.name, { lower: true })
})

export default define<ITag>('Tag', schema)