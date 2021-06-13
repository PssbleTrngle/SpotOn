import { readdirSync } from 'fs'
import { join, resolve } from 'path'
import { RuleError } from './RuleError'
import Operation from './rules/Operation'

const operations = new Map<string, Operation<unknown, unknown>>()

const DIR = join(__dirname, 'rules')
readdirSync(DIR)
   .map(f => resolve(DIR, f))
   .map(f => require(f))
   .map(o => ('default' in o ? o.default : o))
   .forEach(o => operations.set(o.name.toLowerCase(), new o()))

export function getOperations() {
   return [...operations.entries()]
}

export function getOperation<T, V>(type: string) {
   const operation = operations.get(type)
   if (!operation) throw new RuleError('Unknown type')
   return operation as Operation<T, V>
}
