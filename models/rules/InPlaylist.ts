import Joi from "joi";
import { Session } from "next-auth";
import Track from "../../interfaces/Track";
import { getPlaylist, getPlaylists } from "../../lib/spotify";
import { IChildRule } from "../Rule";
import Operation, { RuleError } from "./Operation";

export default class InPlaylist extends Operation<boolean, string> {

   valueType() {
      return Joi.string()
   }

   async apply(track: Track, { value }: IChildRule<boolean, string>, session: Session) {
      const playlist = await getPlaylist(session, value!)
      return !!playlist?.tracks.items.some(t => t.track.id === track.id)
   }

   async valid({ value }: IChildRule<boolean, string>, session: Session) {
      await getPlaylist(session, value!).catch(() => {
         throw new RuleError('Playlist not found')
      })
   }

   async values(session: Session) {
      const { items } = await getPlaylists(session)
      return items.map(it => ({ value: it.id!, display: it.name }))
   }

   async valueDisplay(value: string, session: Session) {
      const playlist = await getPlaylist(session, value)
      return playlist?.name ?? 'Unkown Playlist'
   }

}