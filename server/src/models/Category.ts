import { ITrack } from "../../../client/src/models";
import Api from "../api";
import { warn } from "..";

type Filter<T> = (track: ITrack, values: { [key: string]: string }, api: Api) => T;

export const enum Type {
    LOGIC,
    NUMBER,
    DATE
}

type types = {
    [Type.LOGIC]: boolean
    [Type.NUMBER]: number
    [Type.DATE]: number
}

export type FilterResult<T extends Type> = types[T];

export default class CategoryType<T extends Type = Type> {

    constructor(
        public type: T,
        public name: string,
        public filter: Filter<FilterResult<T>>,
    ) { }

}

const map = new Map<string, CategoryType<Type>>();

export const Categories = [
    new CategoryType(Type.LOGIC, 'label', (t, { labelID }) => t.labels.map(l => l.id).includes(Number.parseInt(labelID))),
    new CategoryType(Type.NUMBER, 'stat', ({ features }, { key }, a) => {
        if (!features) {
            warn('Tried filtering a track without fetched features');
            return 0;
        }
        return features[key] ?? 0;
    }),
    new CategoryType(Type.NUMBER, 'number', (_, { value }) => {
        const i = Number.parseInt(value);
        return isNaN(i) ? 0 : i;
    }),
    new CategoryType(Type.NUMBER, 'popularity', (t => t.popularity))
]

Categories.forEach(c => map.set(c.name, c))

export function findCategory(key: string) {
    const o = map.get(key);
    if (o) return o;
    throw new Error(`Category '${key}' not found`)
}