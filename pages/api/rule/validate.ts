import Joi from "joi";
import { flatten } from "lodash";
import { Session } from "next-auth";
import { exists } from "../../../lib/util";
import wrapper from "../../../lib/wrapper";
import { getOperation } from "../../../models/Operations";
import { IChildRule } from "../../../models/Rule";
import { CompositeRuleError } from "../../../models/rules/GroupOperation";
import { RuleError } from "../../../models/rules/Operation";

const BaseSchema = {
   type: Joi.string().required(),
   children: Joi.array(),
   value: Joi.any(),
   display: Joi.any(),
   name: Joi.string().optional(),
}

const WithValue = Joi.object({
   ...BaseSchema,
   value: Joi.alternatives(Joi.number(), Joi.string()).required(),
   display: Joi.string().required(),
})

const WithChildren = Joi.object({
   ...BaseSchema,
   children: Joi.array()
})

export async function validate(rule: IChildRule, session: Session) {

   const schema = rule.children ? WithChildren : WithValue
   const { error } = schema.validate(rule)
   if (error) {
      const message = error.details[0]?.message
      throw new RuleError(message ?? 'Invalid rule')
   }

   const operation = getOperation(rule.type)
   await operation.valid(rule, session)

   if (rule.children) {
      const errors = await Promise.all(rule.children.map(async (child, i) => {
         try {
            await validate(child, session)
         } catch (e) {
            const composite = CompositeRuleError.of(e)
            if (composite) return composite.errors.map(e => new RuleError(e.message, [i, ...e.path ?? []]))
         }
      })).then(a => a.filter(exists))

      if (errors.length > 0) throw new CompositeRuleError(flatten(errors))
   }

}

export default wrapper(async (req, res, session) => {

   if (req.method === 'POST') try {
      await validate(req.body, session)
      return res.json({ success: true })
   } catch (e) {
      const errors = CompositeRuleError.of(e)?.errors ?? []
      return res.status(400).json(errors.map(e => ({ ...e, message: e.message })))
   }

   res.status(400).json({
      error: 'Invalid method'
   })

})