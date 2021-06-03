import Joi from "joi";
import Track from "../../interfaces/Track";
import { IChildRule } from "../Rule";
import Tag from "../Tag";
import Operation from "./Operation";

export default class HasTag extends Operation<boolean, string> {

   valueType() {
      return Joi.string()
   }

   apply(track: Track, { value }: IChildRule<boolean,string>) {
      return !!track.tags?.find(t => value === t.id)
   }

   async valid({ value }: IChildRule<boolean,string>) {
      return !!value && Tag.exists({ id: value })
   }

}