import Joi from 'joi'
import { flatten } from 'lodash'
import { Session } from 'next-auth'
import { exists } from '../../../lib/util'
import wrapper from '../../../lib/wrapper'
import { getOperation } from '../../../models/Operations'
import { IChildRule } from '../../../models/Rule'
import { CompositeRuleError, RuleError } from '../../../models/RuleError'
import GroupOperation from '../../../models/rules/GroupOperation'

const BaseSchema = {
   type: Joi.string().required(),
   children: Joi.array(),
   value: Joi.any(),
   display: Joi.any(),
   name: Joi.string().optional(),
   id: Joi.string().optional(),
}

const WithValue = Joi.object({
   ...BaseSchema,
   value: Joi.alternatives(Joi.number(), Joi.string()).required(),
   display: Joi.string().required(),
})

const WithChildren = Joi.object({
   ...BaseSchema,
   children: Joi.array(),
})

export async function validateRule(rule: IChildRule, session: Session) {
   try {
      // test basic schema using joi
      const schema = rule.children ? WithChildren : WithValue
      const { error } = schema.validate(rule)
      if (error) {
         const message = error.details[0]?.message
         throw new RuleError(message ?? 'Invalid rule')
      }

      // operation exists
      const operation = getOperation(rule.type)
      // operation specific validation
      await operation.valid(rule, session)

      // Test if either value or children is present depending on operation type
      if (operation instanceof GroupOperation) {
         if (!rule.children?.length) throw new RuleError('children missing')
         if (rule.value) throw new RuleError('value defined')
      } else {
         if (!rule.value) throw new RuleError('value missing')
         if (rule.children) throw new RuleError('children defined')
      }

      if (rule.children) {
         const errors = await Promise.all(
            rule.children.map(async (child, i) => {
               try {
                  await validateRule(child, session)
               } catch (e) {
                  const composite = CompositeRuleError.of(e)
                  if (composite) return composite.errors.map(e => new RuleError(e.message, [i, ...(e.path ?? [])]))
               }
            })
         ).then(a => a.filter(exists))

         if (errors.length > 0) throw new CompositeRuleError(flatten(errors))
      }
   } catch (e) {
      throw CompositeRuleError.of(e)
   }
}

export default wrapper(async (req, res, session) => {
   if (req.method === 'POST')
      try {
         await validateRule(req.body, session)
         return res.json({ success: true })
      } catch (e) {
         if (e instanceof CompositeRuleError) {
            return res.status(400).json(e.errors.map(e => ({ ...e, message: e.message })))
         } else {
            return res.status(500).json({ errors: [], error: 'Internal Server error' })
         }
      }

   res.status(400).json({
      error: 'Invalid method',
   })
})
