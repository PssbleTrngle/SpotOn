import classes from 'classnames';
import React, { memo, MouseEvent, useState, InputHTMLAttributes, useMemo, useEffect } from 'react';
import { Link, useLocation, useParams } from "react-router-dom";
import API, { useLoading, useSubmit, useApi, Loading } from "../Api";
import { ILabel } from "../models";
import { ColorPicker } from './Color';
import { Size, TrackList } from "./Songs";
import { CSSTransition } from 'react-transition-group';
import { FontAwesomeIcon as Icon } from '@fortawesome/react-fontawesome'
import { faFillDrip, faSave } from '@fortawesome/free-solid-svg-icons'

function getBrighness(color: string) {
    const [r1, r2, g1, g2, b1, b2] = color.split('');
    const [r, g, b] = [[r1, r2], [g1, g2], [b1, b2]]
        .map(a => a.join(''))
        .map(s => Number.parseInt(s, 16))
    return r + g + b;
}

export const Editable = (
    props: InputHTMLAttributes<HTMLInputElement> &
    { setValue: (s: string) => void, submit?: () => void, forceButton?: boolean, inProgress?: boolean }
) => {
    const { setValue, submit, className, inProgress, forceButton, ...other } = props;
    const initial = useMemo(() => props.value, [])
    const changed = initial !== props.value;

    return <> <input {...other}
        className={`${className} editable`}
        type='text'
        onChange={e => setValue(e.target.value.trim())}
        autoComplete='off'
        autoCorrect='off'
        autoCapitalize='off'
        spellCheck='false'
    />
        {submit && (changed || forceButton) && <button className={classes('primary', { inProgress })} onClick={() => submit()}>
            <Icon icon={faSave} />
        </button>}
    </>
}

export const Label = memo((props: ILabel & { size?: Size, edit?: boolean }) => {
    const { color, id, edit } = props;

    const [name, setName] = useState('');
    const { post, valid, inProgress } = useSubmit(`label/${id}/edit`, { name, color })

    useEffect(() => {
        setName(props.name);
    }, [props.id])

    const size = props.size ?? Size.NORMAL

    const brightness = getBrighness(color);
    const bright = brightness > 384;

    const path = useLocation().pathname;
    const href = `/labels/${id}`
    const isHere = path.endsWith(href)

    const p = {
        className: classes('label', Size[size].toLowerCase(), { bright, invalid: !valid }),
        style: { background: `#${color}` },
    };

    const l = edit ? <Editable
        {...p}
        {...{ inProgress }}
        forceButton={true}
        submit={post}
        setValue={setName}
        value={name}
        title={'Click to Edit'}
    /> : <p {...p}>{props.name}</p>

    return isHere ? <span>{l}</span> : <Link to={href}>{l}</Link>;
});

function Creator() {
    const [name, change] = useState('');
    const [invalid, setInvalid] = useState(false);

    const create = (e: MouseEvent) => {
        e.preventDefault();
        const valid = /^[A-Z -]{4,32}$/i.test(name);
        setInvalid(!valid);
        if (valid) API.post('label/create', { name });
    }

    return (
        <div>
            <input
                className={classes({ invalid })}
                type='text'
                placeholder='New Label'
                value={name}
                onChange={e => change(e.target.value)}
            />
            <input value='+' type='submit' onClick={create} />
        </div>
    )
}

const View = (props: { id: string }) => {
    const [c1, setColor] = useState<string>()
    const [showPicker, setPicker] = useState(false);
    const togglePicker = () => setPicker(!showPicker);

    const [l, loading] = useApi<ILabel>(`label/${props.id}`);

    useEffect(() => {
        if (l) setColor(l.color);
    }, [l])

    if (loading) return <Loading />
    if (!l) return <span>Not found</span>

    const { tracks, color: c2, ...label } = l;
    const color = c1 ?? c2;

    return <>
        <div className='title'>
            <Label edit={true} size={Size.BIG} {...label} {...{ color }} />
            <button onClick={togglePicker}>
                <Icon icon={faFillDrip} />
            </button>
        </div>

        <CSSTransition in={showPicker} timeout={300}>
            <ColorPicker {...{ color, setColor }} />
        </CSSTransition>

        {tracks && <TrackList {...{ tracks }} />}
    </>
}

function LabelList() {
    return useLoading<ILabel[]>('user/labels', labels => <>
        <Creator />
        <ul>
            {labels.map(label => <Label key={label.id} {...label} />)}
        </ul>
    </>)
}

function Labels() {
    const { id } = useParams();

    if (id) return <View {...{ id }} />
    return <LabelList />
}

export default Labels;