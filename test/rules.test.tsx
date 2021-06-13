import { Session } from 'next-auth'
import { IChildRule } from '../models/Rule'
import { CompositeRuleError } from '../models/RuleError'
import { validateRule } from '../pages/api/rule/validate'

describe('Rule validation', () => {
   async function getFailingPaths(rule: IChildRule) {
      try {
         await validateRule(rule, {} as Session)
         return []
      } catch (e) {
         return (e as CompositeRuleError).errors?.map(it => it.path)
      }
   }

   function failedWithPath(description: string, rule: IChildRule, ...paths: number[][]) {
      it('Failes ' + description, async () => {
         expect(await getFailingPaths(rule)).toEqual(paths)
      })
   }

   failedWithPath(
      'without value',
      {
         id: '',
         type: 'inplaylist',
      },
      []
   )

   failedWithPath(
      'without children',
      {
         id: '',
         type: 'or',
      },
      []
   )

   failedWithPath(
      'with value',
      {
         id: '',
         type: 'and',
         value: '',
      },
      []
   )

   failedWithPath(
      'with children',
      {
         id: '',
         type: 'hastag',
         children: [],
      },
      []
   )
})
