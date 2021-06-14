import wrapper from '../../../lib/wrapper'
import Rule from '../../../models/Rule'
import { validateRule } from './validate'

export default wrapper(async (req, res, session) => {
   if (req.method === 'POST') {
      try {
         await validateRule(req.body, session)

         const rule = await Rule.create({ ...req.body, user: session.user.id })

         return res.json(rule)
      } catch (e) {
         console.error(e)
         return res.status(400).json({ error: 'Invalid rule' })
      }
   }

   res.status(400).json({
      error: 'Invalid method',
   })
})
