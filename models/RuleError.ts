export class RuleError extends Error {
   constructor(public readonly message: string, public readonly path: number[] = []) {
      super(message)
   }
}

export class CompositeRuleError extends Error {
   constructor(public readonly errors: RuleError[]) {
      super(errors[0].message)
   }

   static of(e: any) {
      if (e instanceof CompositeRuleError) return e
      if (e instanceof RuleError) return new CompositeRuleError([e])
      throw e
   }
}
