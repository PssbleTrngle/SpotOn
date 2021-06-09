import Add from "./rules/And";
import HasTag from "./rules/HasTag";
import InPlaylist from "./rules/InPlaylist";
import Operation from "./rules/Operation";
import Or from "./rules/Or";

const operations = new Map<string, Operation<unknown, unknown>>();
[Add, Or, HasTag, InPlaylist].forEach(o => operations.set(o.name.toLowerCase(), new o()))

export function getOperations() {
   return [...operations.entries()]
}

export function getOperation(type: string) {
   const operation = operations.get(type)
   if (!operation) throw new RuleError('Unknown type')
   return operation
}