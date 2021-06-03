import { IRule } from "../models/Rule";
import Image from "./Image";
import List from './List';
import Model from "./Model";
import { SavedTrack } from "./Track";

export default interface Playlist extends Model {
   collaborative: boolean
   description?: string
   images: Image[]
   owner: Model & {
      display_name: string
   }
   primary_color?: string
   public: boolean
   tracks: {
      href: string
      total: number
   }
   rule?: IRule
}

export interface ExtendedPlaylist extends Playlist {
   tracks: List<SavedTrack>
}