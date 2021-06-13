import { Session } from 'next-auth'
import { getSession } from 'next-auth/client'
import { IChildRule } from '../../models/Rule'
import { CompositeRuleError } from '../../models/RuleError'
import { validateRule } from '../../pages/api/rule/validate'

async function getFailingPaths(rule: IChildRule) {
   try {
      await validateRule(rule, (await getSession()) as Session)
      return []
   } catch (e) {
      if (e instanceof CompositeRuleError) return e.errors?.map(it => it.path)
      return [-1]
   }
}

export function ruleFailes(description: string, rule: IChildRule, ...paths: number[][]) {
   it('Fails ' + description, async () => {
      expect(await getFailingPaths(rule)).toEqual(paths)
   })
}

export function ruleCorrect(description: string, rule: IChildRule) {
   it('Works ' + description, async () => {
      expect(await getFailingPaths(rule)).toEqual([])
   })
}
