import Joi from 'joi'
import validate from '../../../../lib/validate'
import Rule from '../../../../models/Rule'
import { validateRule } from '../validate'

export default validate(
   {
      query: {
         id: Joi.string().required(),
      },
   },
   async (req, res, session) => {
      const rule = await Rule.findOne({ _id: req.query.id, user: session.user.id })
      if (!rule) return res.status(404).json({ error: 'Rule not Found' })

      if (req.method === 'PUT') {
         try {
            await validateRule(req.body, session)

            const updated = await Rule.findByIdAndUpdate(rule.id, { ...req.body })

            return res.json(updated)
         } catch (e) {
            return res.status(400).json({ error: 'Invalid rule' })
         }
      } else if (req.method === 'DELETE') {
         await Rule.findByIdAndDelete(rule.id)
         return res.status(200).json({})
      }

      res.status(400).json({
         error: 'Invalid method',
      })
   }
)
