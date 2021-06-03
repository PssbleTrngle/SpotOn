import Joi from "joi";
import validate from "../../../lib/validate";
import Tag from "../../../models/Tag";

export const tagSchema = {
   name: Joi.string().required(),
   color: Joi.string().optional(),
}

export default validate({ body: tagSchema }, async (req, res) => {

   if (req.method === 'POST') {
      return res.json(await Tag.create(req.body))
   }

   res.status(400).json({
      error: 'Invalid method'
   })

})