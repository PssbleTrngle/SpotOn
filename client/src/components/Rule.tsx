import classes from 'classnames';
import React, { Fragment, useEffect, useRef, useState } from 'react';
import { IRule } from "../models";
import { ICategoryCreator } from './RuleBuilder'

export interface ICreator {
    handle: (r: IRule) => unknown
    rule?: IRule
}

export function Creator(props: ICreator & { categories: ICategoryCreator[] }) {
    const { handle, rule: oldRule, categories } = props;
    const [typeIndex, setType] = useState(0);

    const type = categories[typeIndex - 1];

    const getDefault = () => type?.valueFrom?.call(type, oldRule);

    const [value, setValue] = useState(getDefault);
    const rule = type?.create(value);

    useEffect(() => {
        if (oldRule) {
            const next = categories.findIndex(c => c.isRule(oldRule));
            setType(next + 1);
        } else {
            setType(0);
        }
    }, [oldRule])

    useEffect(() => {
        setValue(getDefault);
    }, [typeIndex])

    const inputs = () => {
        const i = type?.inputs([value, setValue]) ?? <p />;
        return Array.isArray(i) ? i : [i];
    }

    return <>
        <h3>Choose a category</h3>
        <select value={typeIndex} onChange={e => {
            setType(Number.parseInt(e.target.value))
            setValue(getDefault);
        }}>
            <option value={0}>select...</option>
            {categories.map(({ key: type }, i) =>
                <option
                    value={i + 1}
                    key={type}
                >
                    {type}
                </option>
            )}
        </select>

        {inputs().map((input, i) =>
            <Fragment key={i}>
                <h3>Choose a value</h3>
                {input}
            </Fragment>
        )}

        <button disabled={!rule} onClick={rule && (() => handle(rule))}>
            {oldRule ? 'Update' : 'Create'}
        </button>
    </>
}

type RuleProps = IRule & {
    invalid?: boolean;
    edit?: {
        setRule: (r: IRule) => unknown;
        setCreator: (element?: ICreator) => unknown;
    }
    error?: { level: number, index: number };
    level?: number;
    index?: number;
}

function useEditor(props: RuleProps) {
    const { edit, children } = props;

    const setRule = (n: IRule) => {
        const old = { ...props };
        const preserveChildren = n.children && old.children;
        if (preserveChildren) n.children = preserveChildren;
        edit?.setRule(n);
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
    const { category, children, operator, edit, error } = props;
    const { addChild, editChild } = useEditor(props);
    const level = props.level ?? 0;

    if (children && children.length > 0) {

        return <>
            {children.map((c, i) => [

                <Rule {...{ error }}
                    level={level + 1}
                    index={i}
                    key={`r-${i}`} {...c}
                    edit={editChild(i)}
                    {...{ error }}
                />,
                <span key={`o-${i}`}>{operator.name}</span>,

            ]).flatMap(a => a).slice(0, children.length * 2 - 1)}
            {edit && <button className='create' onClick={e => {
                e.stopPropagation();
                edit.setCreator({ handle: addChild })
            }}>+</button>}
        </>;

    } else if (category) {
        return <>{category.text}</>;
    } else if (operator.name === 'has') {
        return <>Placeholder</>
    } else {
        return <>{operator.name}</>;
    }
}

function Tooltip(rule: IRule) {
    const { category, operator } = rule;

    const text = (() => {
        switch (operator.name) {
            case 'and': return 'All have to match'
            case 'or': return 'Any has to match'
            case 'xor': return 'Exactly one has to match'
            case 'without': return 'Exclude matches'
            case 'has': return category?.type ?? 'Invalid'
            case 'greater': return 'Greater than'
            case 'smaller': return 'Smaller than'
            case 'all': return 'All tracks'
        }
    })();

    return <div className='tooltip'>{text}</div>
}

export function Rule(rule: RuleProps) {
    const { edit, error, level, index } = rule;
    const [hovered, hover] = useState(false);
    const ref = useRef<HTMLSpanElement>(null);
    const { setRule } = useEditor(rule);

    const child = level && level > 0;
    const invalid = error && error?.level === level && error?.index === index;

    const r = <span
        className={classes('rule', { child, hovered, invalid })}
        ref={ref}
        onMouseOut={() => hover(false)}
        onMouseMove={() => hover(!ref.current?.querySelector('.rule:hover'))}
        role={edit && 'button'}
        onClick={e => {
            e.stopPropagation();
            edit?.setCreator({ rule, handle: setRule });
        }}
    >
        <RuleContent {...rule} />
        {hovered && <Tooltip {...rule} />}
    </span>;

    if (child) return r;
    return <div style={{ gridArea: 'rule' }}>{r}</div>

}

export default Rule;