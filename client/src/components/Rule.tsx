import API, { useApi } from "../Api";
import React, { useState, useRef, useEffect } from 'react';
import { ILabel, IRule, Operator as Operator, GroupOperators } from "../models";
import classes from 'classnames';

type option = { value: number | string, text?: string };
type ICategoryCreator = {
    type: string;
    options?: option[]
    createRule: (o?: option) => IRule | undefined;
} & ({
    isRule?: undefined;
    isOption: (r: IRule, o: option) => boolean;
} | {
    isRule: (r: IRule) => boolean;
    isOption?: undefined;
})

class SimpleCategory {

    constructor(
        public type: string,
        public createRule: () => IRule,
        public isRule: (r: IRule) => boolean,
    ) { }

}

class ValueCategory {

    constructor(
        public type: string,
        public options: option[],
        private create: (o: option) => IRule,
        public isOption: (r: IRule, o: option) => boolean,
    ) { }

    createRule(o?: option) {
        return o ? this.create(o) : undefined;
    }

}

function useCategories(): ICategoryCreator[] {
    const [labels] = useApi<ILabel[]>('user/labels');

    return [
        new ValueCategory('label',
            labels?.map(l => ({ value: l.id, text: l.name })) ?? [],
            ({ value, text }) => ({
                operator: Operator.HAS, category: {
                    type: 'label', text: text, value: value.toString()
                }
            }),
            ({ category: c }, o) => c?.type === 'label' && c?.value === o.value,
        ),
        new ValueCategory('group',
            GroupOperators.map(o => ({ value: o, text: Operator[o] })),
            ({ value }) => ({
                operator: value as Operator, children: [
                    { operator: Operator.PLACEHOLDER },
                    { operator: Operator.PLACEHOLDER },
                ]
            }),
            (r, o) => GroupOperators.includes(r.operator) && r.operator === o.value,
        ),
        new SimpleCategory('all',
            () => ({ operator: Operator.ALL }),
            r => r.operator === Operator.ALL,
        )
    ];
}

function Creator(props: { handle: (r: IRule) => unknown, rule?: IRule }) {
    const { handle, rule: oldRule } = props;
    const [typeIndex, setType] = useState(0);
    const [valueIndex, setValue] = useState(0);
    const categories = useCategories();

    useEffect(() => {
        if (oldRule) {
            const old = categories.map((t, type) => {
                if (t.isRule) return { valid: t.isRule(oldRule), type, option: 0 };
                const option = (t.options ?? []).findIndex(o => t.isOption(oldRule, o)) + 1;
                return { valid: !!option, type, option }
            }).find(o => o.valid);

            if (old) {
                const { type, option } = old;
                setType(type + 1);
                setValue(option);
            }
        }
    }, [oldRule]);

    const type = categories[typeIndex - 1];
    const values = type?.options;
    const value = values && values[valueIndex - 1];
    const rule = type?.createRule(value);

    return <>
        <h3>Choose a category</h3>
        <select value={typeIndex} onChange={e => {
            setType(Number.parseInt(e.target.value))
            setValue(0);
        }}>
            <option value={0}>select...</option>
            {categories.map(({ type }, i) =>
                <option
                    value={i + 1}
                    key={type}
                >
                    {type}
                </option>
            )}
        </select>
        <h3>Choose a value</h3>
        {type ? ((values && values.length > 0)
            ? <select value={valueIndex} onChange={e => setValue(Number.parseInt(e.target.value))}>
                <option value={0}>select...</option>
                {values.map(({ value, text }, i) =>
                    <option
                        value={i + 1}
                        key={value}
                    >
                        {(text ?? value).toString().toLowerCase()}
                    </option>
                )}
            </select>
            : <p>Not neccessary</p>)
            : <p />
        }
        <button disabled={!rule} onClick={rule && (() => handle(rule))}>
            {oldRule ? 'Update' : 'Create'}
        </button>
    </>
}

type RuleProps = IRule & {
    edit?: {
        setRule: (r: IRule) => unknown;
        setCreator: (element?: JSX.Element) => unknown;
    }
    child?: boolean;
}

function useEditor(props: RuleProps) {
    const { edit, children } = props;

    const setRule = (n: IRule) => {
        const old = { ...props };
        const preserveChildren = n.children && old.children;
        if (preserveChildren) n.children = preserveChildren;
        edit?.setRule(n);
        console.log({ old, preserveChildren })
    }

    const setChild = (i: number, child: IRule) => {
        const n = { ...props };
        if (!n.children) return;
        n.children[i] = child;
        setRule(n);
    }

    const addChild = (child: IRule) => {
        const n = { ...props, children };
        if (!n.children) n.children = [];
        n.children.push(child);
        setRule(n);
        edit?.setCreator();
    }

    const editChild = (i: number) => (edit ? {
        ...edit,
        setRule: (r: IRule) => setChild(i, r)
    } : undefined);

    return { addChild, setChild, editChild, setRule };
}

function RuleContent(props: RuleProps) {
    const { category, children, operator, edit } = props;
    const { addChild, editChild } = useEditor(props);

    if (children) {

        return <>
            {children.map((c, i) => [

                <Rule key={`r-${i}`} child={true} {...c} edit={editChild(i)} />,
                <span key={`o-${i}`}>{Operator[operator].toLowerCase()}</span>,

            ]).flatMap(a => a).slice(0, children.length * 2 - 1)}
            {edit && <button className='create' onClick={e => {
                e.stopPropagation();
                edit.setCreator(<Creator handle={addChild} />)
            }}>+</button>}
        </>;

    } else if (category) {
        return <>{category.text ?? category.value}</>;
    } else {
        return <>{Operator[operator].toLowerCase()}</>;
    }
}

function Tooltip(rule: IRule) {
    const { category, operator } = rule;

    const text = (() => {
        switch (operator) {
            case Operator.AND: return 'All have to match'
            case Operator.OR: return 'Any has to match'
            case Operator.XOR: return 'Exactly one has to match'
            case Operator.WITHOUT: return 'Exclude matches'
            case Operator.HAS: return category?.type ?? 'Invalid';
        }
    })();

    return <div className='tooltip'>{text}</div>
}

export function Rule(rule: RuleProps) {
    const { child, edit } = rule;
    const [hovered, hover] = useState(false);
    const ref = useRef<HTMLSpanElement>(null);
    const { setRule } = useEditor(rule);

    const r = <span
        className={classes('rule', { child, hovered })}
        ref={ref}
        onMouseOut={() => hover(false)}
        onMouseMove={() => hover(!ref.current?.querySelector('.rule:hover'))}
        role={edit && 'button'}
        onClick={e => {
            e.stopPropagation();
            edit?.setCreator(<Creator {...{ rule }} handle={setRule} />);
        }}
    >
        <RuleContent {...rule} />
        {hovered && <Tooltip {...rule} />}
    </span>;

    if (child) return r;
    return <div style={{ gridArea: 'rule' }}>{r}</div>

}

export default Rule;