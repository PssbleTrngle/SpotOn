import Joi from "joi";
import { getPlaylist } from "../../../lib/spotify";
import validate from "../../../lib/validate";
import Tag from "../../../models/Tag";

export default validate({
   body: {
      playlist: Joi.string().required(),
   }
}, async (req, res, session) => {

   if (req.method === 'POST') {

      const user = session.user.id
      const playlist = await getPlaylist(session, req.body.playlist)

      let name = playlist.name.toLowerCase()
      const nameTaken = await Tag.exists({ name, user })
      if (nameTaken) name += `-${playlist.id}`

      const tag = await Tag.create({
         name, user,
         importedFrom: playlist.id,
         tracks: playlist.tracks.items.map(t => t.track.id),
      })

      return res.json(tag)
   }

   res.status(400).json({
      error: 'Invalid method'
   })

})