import React, { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';
import { useHistory } from "react-router-dom";
import { Loading, useApi, useSubmit } from "../Api";
import { ILabel, IOperator, IRule, Stats } from "../models";
import Rule, { Creator, ICreator } from "./Rule";

export function Builder() {
    const categories = useCategories();
    const [example, loading] = useApi<IRule>('operators/example');

    const [rule, setRule] = useState<IRule>();
    const [creator, setCreator] = useState<ICreator | undefined>();
    const [name, setName] = useState('');

    const history = useHistory();

    const submit = useSubmit('playlist/create', { rule, name }, id => history.push(`/playlists/${id}`))
    const validate = useSubmit('playlist/validate', { rule, name })

    const valid = validate.valid && submit.valid;
    const error = validate.error ?? submit.error;
    const message = validate.message ?? submit.message;

    useEffect(() => {
        if (rule) validate.post();
    }, [rule]);

    // Wait until the operators have been fetched,
    // then create an example rule
    useEffect(() => {
        if (!loading) setRule(example);
    }, [loading])

    if (!rule) return <Loading />

    return <>
        <input
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ gridArea: 'name' }}
            type='text'
            placeholder='Enter a name'
        />
        <button
            style={{ gridArea: 'submit' }}
            className='primary'
            onClick={submit.post}
        >
            Create
        </button>
        {message && <p className='message error'>{message}</p>}

        <Rule {...rule} invalid={!valid} edit={{ setRule, setCreator }} {...{ error }} />
        <div className='creator'>
            {creator && <div>
                <Creator {...creator} {...{ categories }} />
            </div>}
        </div>
    </>;
}
export function useOperators() {
    const [operators, loading] = useApi<IOperator[]>('operators');
    const all = operators ?? [];
    const group = useMemo(() => all.filter(o => o.isGroup), [all]);

    const placeholder: IRule = {
        operator: find('has')
    }

    function find(key: string): IOperator {
        const o = all.find(o => o.name === key);
        if (o) return o;
        return { isGroup: false, name: 'invalid' }
    };

    return { all, group, find, placeholder, loading };
}

type State<T> = [T, Dispatch<SetStateAction<T>>]
type Option = { value: string, text: string };

export type ICategoryCreator<R = IRule, T = any> = {
    key: string;
    valueFrom?: (r?: IRule) => T;
    isRule: (r: IRule) => boolean;
    create: (value: T) => R | undefined;
    inputs: (value: State<T>) => JSX.Element | JSX.Element[];
}

class SimpleCategory<R = IRule> implements ICategoryCreator<R, string> {

    constructor(
        public key: string,
        public create: () => R | undefined,
        public isRule: (r: IRule) => boolean,
    ) { }

    inputs = () => <p>Not neccessary</p>;

}

class NumberCategory<R = IRule> implements ICategoryCreator<R, string> {

    constructor(
        public key: string,
        public create: (v: string) => R,
        public isRule: (r: IRule) => boolean,
        private max = 100,
        private min = 0,
        private step = 10,
    ) { }

    inputs([value, setValue]: State<string>) {
        const i = Number.parseInt(value);
        if (isNaN(i)) {
            setValue('50');
            return [];
        }
        return <input
            type='number'
            onChange={e => setValue(e.target.value)}
            value={i}
            max={this.max}
            min={this.min}
            step={this.step}
        />
    }

}

class OptionCategory<R = IRule> implements ICategoryCreator<R, number> {

    constructor(
        public key: string,
        public options: Option[],
        private c: (o: Option) => R,
        public isRule: (r: IRule) => boolean,
        public isOption: (r: IRule, o: Option) => boolean,
    ) { }

    valueFrom(rule?: IRule) {
        if (!rule) return 0;
        return this.options.findIndex(o => this.isOption(rule, o)) + 1;
    }

    create(index: number) {
        const option = this.options[index - 1];
        if (!option) return undefined;
        return this.c(option);
    }

    inputs([valueIndex, setValue]: State<number>) {
        return (
            <select value={valueIndex} onChange={e => setValue(Number.parseInt(e.target.value))}>
                <option value={0}>select...</option>
                {this.options.map(({ value, text }, i) =>
                    <option
                        value={i + 1}
                        key={value}
                    >
                        {(text ?? value).toLowerCase()}
                    </option>
                )}
            </select>
        )
    }

}

type Values = { [key: string]: string | undefined };
class MergeCategory implements ICategoryCreator<IRule, Values> {

    constructor(
        public key: string,
        private operator: IOperator,
        private text: (v: Values) => string,
        private categories: ICategoryCreator<string>[],
    ) { }

    valueFrom(rule?: IRule) {
        if (!rule) return {};
        return this.categories.map(c => c.valueFrom).reduce((o, r) => ({ ...o, ...r }), {}) as IRule;
    }

    isRule(rule: IRule) {
        return this.categories.map(c => c.isRule(rule)).reduce((a, b) => a && b, true)
    }

    create(v?: Values) {
        if (!v) return undefined;

        const created = this.categories.map(c => [c.key, c.create(v[c.key])])
        if (created.some(([k, v]) => !v)) return undefined;
        const values = created.reduce((o, [key, value]) => ({ ...o, [key as string]: value }), {})

        return {
            operator: this.operator,
            category: {
                text: this.text(v),
                type: this.key,
                values
            }
        }
    }

    inputs([values, setValues]: State<Values>) {
        if (!values) return <div />;
        return this.categories.map(c => c.inputs([
            values[c.key],
            v => setValues(vs => {
                const n = { ...vs };
                n[c.key] = v;
                return n;
            }),
        ])).flatMap(a => a);
    }

}

export function useCategories(): ICategoryCreator[] {
    const [labels] = useApi<ILabel[]>('user/labels');
    const { group: GroupOperators, find, placeholder } = useOperators();

    const has = (values: Values, type: string, text?: string): IRule => {
        return {
            operator: find('has'), category: {
                type, text: text ?? type, values: Object.keys(values).reduce((o, k) => ({
                    ...o, [k]: values[k]
                }), {})
            }
        }
    }

    return [
        new OptionCategory('group',
            GroupOperators.map(o => ({ value: o.name, text: o.name })),
            ({ value }) => ({
                operator: find(value as string), children: [0, 1].map(() => placeholder),
            }),
            ({ operator }) => GroupOperators.includes(operator),
            ({ operator }, o) => operator.name === o.value,
        ),
        new OptionCategory('label',
            labels?.map(l => ({ value: l.id.toString(), text: l.name })) ?? [],
            ({ text, value }) => has({ labelID: value }, 'label', text),
            ({ category }) => category?.type === 'label',
            ({ category }, o) => category?.values.labelID === o.value,
        ),
        new SimpleCategory('all',
            () => ({ operator: find('all') }),
            r => r.operator.name === 'all',
        ),
        new OptionCategory('stat',
            Object.keys(Stats).map(s => ({ value: s, text: s })),
            ({ text, value }) => has({ key: value }, 'stat', text),
            ({ category }) => category?.type === 'stat',
            ({ category }, o) => category?.values.key === o.value,
        ),
        new NumberCategory('number',
            value => has({ value }, 'number', value),
            ({ category }) => category?.type === 'number',
        ),
        new SimpleCategory('popularity',
            () => has({}, 'popularity'),
            ({ category }) => category?.type === 'popularity',
        ),
    ];
}

export default Builder;