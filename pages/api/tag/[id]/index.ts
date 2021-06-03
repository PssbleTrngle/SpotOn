import Joi from "joi";
import { tagSchema } from "..";
import validate from "../../../../lib/validate";
import Tag from "../../../../models/Tag";

export default validate({
   body: tagSchema,
   query: {
      id: Joi.string().required(),
   }
}, async (req, res) => {

   const { id } = req.query

   if (req.method === 'PUT') {
      return res.json(await Tag.updateOne({ id: id as string }, req.body))
   }

   res.status(400).json({
      error: 'Invalid method'
   })

})