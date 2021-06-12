import Joi from "joi";
import { getSavedTracks } from "../../lib/spotify";
import validate from "../../lib/validate";

export default validate({
   query: {
      limit: Joi.number().integer().positive(),
      offset: Joi.number().integer().positive().allow(0),
   }
}, async (req, res, session) => {

   if (req.method === 'GET') {

      const tracks = await getSavedTracks(session, req.query)
      return res.send(tracks)

   }

   res.status(400).json({
      error: 'Invalid method'
   })

})