import Joi from "joi";
import { uniq } from 'lodash';
import validate from "../../../../lib/validate";
import Tag from "../../../../models/Tag";

export default validate({
   query: {
      id: Joi.string().required(),
   },
   body: {
      tracks: Joi.array().items(Joi.string())
   },
}, async (req, res) => {

   const id = req.query.id as string
   const tracks = req.body.tracks as string[]
   const tag = await Tag.findById(id)

   if (!tag) return res.status(404).json({ error: 'Tag not found' })

   if (req.method === 'POST') {

      tag.tracks = uniq([...tag.tracks, ...tracks])

   } else if (req.method === 'DELETE') {

      tag.tracks = tag.tracks.filter(t => !tracks.includes(t))

   } else {
      res.status(400).json({ error: 'Invalid method' })
   }
   
   await tag.save()

   return res.status(200).end()

})