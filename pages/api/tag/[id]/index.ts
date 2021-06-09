import Joi from "joi";
import { tagSchema } from "..";
import validate from "../../../../lib/validate";
import Tag from "../../../../models/Tag";

export default validate({
   body: tagSchema,
   query: {
      id: Joi.string().required(),
   }
}, async (req, res, session) => {

   const id = req.query.id as string

   if (req.method === 'PUT') {
      const updated = await Tag.findByIdAndUpdate(id, { ...req.body, user: session.user.id })
      return res.json(updated)
   }

   res.status(400).json({
      error: 'Invalid method'
   })

})