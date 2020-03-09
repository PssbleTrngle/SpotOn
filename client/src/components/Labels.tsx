import API, { useLoading } from "../Api";
import React, { useState } from 'react';
import { ILabel, ITrack } from "../models";
import classes from 'classnames';
import { useParams, Link } from "react-router-dom";
import { TrackList, Size } from "./Songs";
import { maxHeaderSize } from "http";

function getBrighness(color: string) {
    const [r1, r2, g1, g2, b1, b2] = color.split('');
    const [r, g, b] = [[r1, r2], [g1, g2], [b1, b2]]
        .map(a => a.join(''))
        .map(s => Number.parseInt(s, 16))
    return r + g + b;
}

export function Label(props: ILabel & { size?: Size }) {
    const { name, color, id } = props;
    const size = props.size ?? Size.NORMAL

    const brightness = getBrighness(color);
    const bright = brightness > 384;

    return (
        <Link to={`/labels/${id}`}>
            <div className={classes('label', Size[size].toLowerCase(), { bright })} style={{ background: `#${color}` }}>
                {name}
            </div>
        </Link>
    );
}

function Creator() {
    const [name, change] = useState('');
    const [invalid, setInvalid] = useState(false);

    const create = () => {
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
            <button onClick={create}>+</button>
        </div>
    )
}

function View(props: { id: string }) {
    return useLoading<ILabel>(`label/${props.id}`, ({ tracks, ...label }) =>
        <>
            <Label {...label} />
            {tracks && <TrackList {...{ tracks }} />}
        </>
    );
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