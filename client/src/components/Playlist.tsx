import { faSyncAlt, faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon as Icon } from '@fortawesome/react-fontawesome';
import classes from 'classnames';
import React from 'react';
import { Link, useParams } from "react-router-dom";
import API, { useLoading } from "../Api";
import { IPlaylist } from "../models";
import { Image } from './App';
import Rule from "./Rule";
import { Cell, TrackList } from "./Songs";

const Sync = (props: { created: boolean, id: string }) => {
    const { id, created } = props;
    const text = created ? 'Sync with Spotify' : 'Add to Spotiy';
    const icon = created ? faSyncAlt : faPlusCircle;
    return <button
        className={classes('sync', { primary: !created })}
        onClick={() => API.post(`playlist/${id}/sync`)}>
        <span>{text}</span>
        <Icon {...{ icon }} />
    </button>
}

const coverFor = ({ spotify }: IPlaylist, size?: number) => ({
    url: spotify?.images[0]?.url ?? '',
    width: size,
    height: size,
});

const View = (props: { id: string }) => {

    return useLoading<IPlaylist>(`playlist/${props.id}`, p =>
        <>
            <Sync {...props} created={!!p.spotify} />
            <Image alt={p.name} {...coverFor(p, 300)} />

            <h1 className='title'>{p.name}</h1>
            {p.spotify && <div style={{ gridArea: 'info' }}>
                <p>{p.spotify.description}</p>
            </div>}

            {p.rule && <Rule {...p.rule} />}

            {p.tracks && <TrackList tracks={p.tracks} />}
        </>
    );
}

function Playlists() {
    return useLoading<IPlaylist[]>('playlist', playlist => <>
        <Link className='primary' role='button' to='/playlists/create'>Create new Playlist</Link>
        <div className='grid'>
            {playlist.map(model =>
                <Cell
                    {... { model }}
                    key={model.id}
                    link={`/playlists/${model.id}`}
                    cover={coverFor(model, 200)}
                />
            )}
        </div>
    </>)
}

function Playlist() {
    const { id } = useParams();

    if (id) return <View {...{ id }} />
    return <Playlists />
}

export default Playlist;