import { exists } from "..";
import { ICategory, IOperator, IRule, ITrack } from "../models";
import Api from "../api";
import CategoryType, { FilterResult, findCategory, Type } from "./Category";

interface IVRule extends IRule {
    level: number;
    index: number;
}

type Filter<T> = ((track: ITrack, api: Api) => T);
export default class Operator<T extends Type = Type> implements IOperator {

    isGroup!: boolean;

    constructor(
        public type: Type | ((c: CategoryType<Type>) => Type),
        public name: string,
        public filter: (r: IVRule) => Filter<FilterResult<T>>,
        public maxChildren?: number,
    ) {
        this.isGroup = !!maxChildren;
    }

}

export class ValidateError extends Error {

    constructor(message: string, public level: number, public index: number) {
        super(message);
    }

}

export class GroupOperator<A extends Type> extends Operator<Type.LOGIC> {

    private acceptTypes(children: IRule[], level: number) {

        const findType = (operator: IOperator, category?: ICategory) => {
            const type = findOperator(operator.name).type
            if (typeof type === 'function') {
                if (!category?.type) return null;
                const c = findCategory(category?.type);
                if (c) return type(c);
                else return null;
            }
            else return type;
        }

        const types = children.map(({ operator, category }) =>
            findType(operator, category)
        );

        const wrongIndex = types.findIndex((type) => type !== this.accept);
        if (wrongIndex >= 0) {
            throw new ValidateError(`Child can not be used in this context`, level + 1, wrongIndex);
        }
    }

    constructor(
        public accept: A,
        name: string,
        merge: (f: Filter<FilterResult<A>>[]) => Filter<FilterResult<Type.LOGIC>>,
        maxChildren = 10,
    ) {
        super(Type.LOGIC, name, ({ children, index, level }) => {
            if (!children || children.length < 2) throw new ValidateError('Not enough children', level, index);
            if (children.length > maxChildren) throw new ValidateError('Too many children', level, index);

            this.acceptTypes(children, level);

            const operators = children.map(c => c.operator.name).map(findOperator);
            const existing = operators.filter(exists);
            const m = operators.length - existing.length;
            if (m > 0) throw new ValidateError(`${m} invalid child operators`, level, index);

            const filters = existing.map((o, i) => o.filter({ ...children[i], level: level + 1, index: i }))
            return merge(filters as any[]);
        }, maxChildren);
    }

}

class CategoryOperator<T extends Type> extends Operator<T> {
    constructor(
        name: string,
        filter: (c: ICategory) => Filter<FilterResult<T>>,
    ) {
        super(c => c.type, name, ({ category, level, index }) => {
            if (!category) throw new ValidateError('Replace placeholder value', level, index);
            return filter(category);
        });
    }
}

const map = new Map<string, Operator<Type>>();

export const Operators = [
    new CategoryOperator('has', ({ values, type }) => (track, api) => {
        const cat = findCategory(type);
        return cat.filter(track, values, api);
    }),

    new Operator(Type.LOGIC, 'all', () => () => true),

    new GroupOperator(Type.LOGIC, 'and', f => f.reduce((f1, f2) => (t, api) => f1(t, api) && f2(t, api), () => true)),
    new GroupOperator(Type.LOGIC, 'or', f => f.reduce((f1, f2) => (t, api) => f1(t, api) || f2(t, api), () => false)),
    new GroupOperator(Type.LOGIC, 'xor', ([a, b]) => ((r, api) => (a(r, api) && !b(r, api)) || (!a(r, api) && b(r, api)))),
    new GroupOperator(Type.LOGIC, 'without', ([a, b]) => ((r, api) => a(r, api) && !b(r, api)), 2),

    new GroupOperator(Type.NUMBER, 'greater', ([a, b]) => ((r, api) => a(r, api) > b(r, api)), 2),
    new GroupOperator(Type.NUMBER, 'smaller', ([a, b]) => ((r, api) => a(r, api) < b(r, api)), 2),

]

Operators.forEach(o => map.set(o.name, o))

export function findOperator(key: string) {
    const o = map.get(key);
    if (o) return o;
    throw new Error(`Operator '${key}' not found`)
}