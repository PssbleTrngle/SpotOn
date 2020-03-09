import API, { useLoading } from "../Api";
import React, { useState, useRef } from 'react';
import { ILabel, IPlaylist, ITrack, IRule, Opererator } from "../models";
import classes from 'classnames';
import { useParams, Link } from "react-router-dom";
import { TrackList, Size } from "./Songs";

function RuleContent(rule: IRule) {
    const { category, children, operator } = rule;
    if (category) {
        return <>{category.text ?? category.value}</>;
    } else if (children && children.length > 0) {
        return <>{children.map(c => [
            <Rule child={true} {...c} />,
            <span>{Opererator[operator].toLowerCase()}</span>,
        ]).flatMap(a => a).slice(0, children.length * 2 - 1)
        }</>;
    }

    return <span>Invalid</span>
}

function Tooltip(rule: IRule) {
    const { category, operator } = rule;

    const text = (() => {
        switch(operator) {
            case Opererator.AND: return 'All have to match'
            case Opererator.OR: return 'Any has to match'
            case Opererator.XOR: return 'Exactly one has to match'
            case Opererator.WITHOUT: return 'Exclude matches'
            case Opererator.HAS: return category?.type ?? 'Invalid';
        }
    })();

    return <div className='tooltip'>{text}</div>
}

export function Rule(rule: IRule & { child?: boolean }) {
    const { child } = rule;
    const [hovered, hover] = useState(false);
    const ref = useRef<HTMLSpanElement>(null);

    const r = <span
        className={classes('rule', { child, hovered })}
        ref={ref}
        onMouseOut={() => hover(false)}
        onMouseMove={() => hover(!ref.current?.querySelector('.rule:hover'))}
    >
        <RuleContent {...rule} />
        {hovered && <Tooltip {...rule} />}
    </span>;

    if (child) return r;
    return <div style={{ gridArea: 'rule' }}>{r}</div>

}

function Sync(props: { text: string, id: string }) {
    const { id, text } = props;
    return <button onClick={() => API.post(`playlist/${id}/sync`)}>{text}</button>
}

function View(props: { id: string }) {

    return useLoading<IPlaylist>(`playlist/${props.id}`, ({ name, tracks, rule, spotify }) =>
        <>
            <Sync {...props} text={spotify ? 'Sync with Spotify' : 'Add to Spotiy'} />
            <h1 className='title'>{name}</h1>
            {spotify && <div style={{ gridArea: 'info' }}>
                <p>{spotify.description}</p>
            </div>}
            {rule && <Rule {...rule} />}
            {tracks && <TrackList {...{ tracks }} />}
        </>
    );
}

function Playlists() {
    return useLoading<ILabel[]>('user/playlists', playlist => <>
        <ul>
            {playlist.map(({ id, name }) =>
                <li key={id}><Link to={`/playlists/${id}`}>{name}</Link></li>
            )}
        </ul>
    </>)
}

function Playlist() {
    const { id } = useParams();

    if (id) return <View {...{ id }} />
    return <Playlists />
}

export default Playlist;