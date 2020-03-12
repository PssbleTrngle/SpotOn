import API, { useLoading } from "../Api";
import React, { useState } from 'react';
import { ILabel, IPlaylist, IRule, Operator as Operator } from "../models";
import { useParams, Link } from "react-router-dom";
import { TrackList } from "./Songs";
import Rule from "./Rule";

function Builder() {
    const [rule, setRule] = useState<IRule>({
        operator: Operator.AND,
        children: [
            { operator: Operator.HAS, category: { type: 'label', value: '1' } },
            { operator: Operator.HAS, category: { type: 'label', value: '2' } },
        ]
    });

    const [creator, setCreator] = useState<JSX.Element | undefined>();

    return <>
        <Rule {...rule} edit={{ setRule, setCreator }} />
        <div className='creator'>{creator}</div>
    </>;
}

function Sync(props: { text: string, id: string }) {
    const { id, text } = props;
    return <button className='sync' onClick={() => API.post(`playlist/${id}/sync`)}>{text}</button>
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
        <Link to='/playlists/create'>Create new Playlist</Link>
        <ul>
            {playlist.map(({ id, name }) =>
                <li key={id}><Link to={`/playlists/${id}`}>{name}</Link></li>
            )}
        </ul>
    </>)
}

function Playlist() {
    const { id } = useParams();

    if (id === 'create') return <Builder />
    if (id) return <View {...{ id }} />
    return <Playlists />
}

export default Playlist;