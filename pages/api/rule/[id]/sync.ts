import Joi from 'joi'
import { Session } from 'next-auth'
import { createPlaylist, getPlaylist, updatePlaylist } from '../../../../lib/spotify'
import validate from '../../../../lib/validate'
import Rule, { IRule } from '../../../../models/Rule'

async function findOrCreatePlaylist(session: Session, rule: IRule) {
   if (rule.playlist) {
      return await getPlaylist(session, rule.playlist)
   } else {
      const playlist = await createPlaylist(session, rule.name)
      await Rule.findByIdAndUpdate(rule.id, { playlist: playlist.id })
      return playlist
   }
}

export default validate(
   {
      query: {
         id: Joi.string().required(),
      },
   },
   async (req, res, session) => {
      const rule = await Rule.findOne({ _id: req.query.id, user: session.user.id })
      if (!rule) return res.status(404).json({ error: 'Rule not Found' })

      if (req.method === 'POST') {
         const [tracks, playlist] = await Promise.all([rule.tracks(session), findOrCreatePlaylist(session, rule)])

         await updatePlaylist(session, playlist.id!, tracks)

         return res.status(200).json({})
      }

      res.status(400).json({
         error: 'Invalid method',
      })
   }
)
