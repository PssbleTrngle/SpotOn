import { ITag } from "../models/Tag";
import Image from "./Image";
import Model from "./Model";

export interface SavedTrack {
   added_at: string
   track: Track
}

export type Artist = Model

export interface Album extends Model {
   artists: Artist[]
   images: Image[]
}

export default interface Track extends Model {
   album: Album
   artists: Artist[]
   popularity: number
   duration_ms: number
   explicit: boolean
   tags?: ITag[]
}