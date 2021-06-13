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
      const errors: RuleError[] = e instanceof RuleError ? [e] : e.errors ?? []
      if (errors.length) return new CompositeRuleError(errors)
      return null
   }
}
