import classes from 'classnames';
import React, { memo, ReactText, useEffect, useMemo, useState } from 'react';
import { Link } from "react-router-dom";
import API, { Loading, useApi } from "../Api";
import { IImage, ILabel, ITrack, WithID } from "../models";
import { Image } from './App';
import { Label, LabelIcon } from './Labels';
import useSelection, { ISelection } from '../Selection';
import { IAction, useContextMenu } from './ContextMenu';

export enum Size {
    SMALL = 2,
    NORMAL = 1,
    BIG = 0,
}

/*
interface ISelection<O extends WithID> {
    click(e: React.MouseEvent, o?: O): void,
    move(e: React.MouseEvent, o?: O): void,
    isSelected(o: O): boolean,
    getSelected(): O[],
}
*/

/*
function useSelection<O extends WithID>(models: O[]): ISelection<O> {
    const [selected, setSelected] = useState<ReactText[]>([]);
    const [lastSingle, setLastSingle] = useState<ReactText | undefined>();

    const ids = useMemo(() => models.map(m => m.id), [models])

    const selectedUntil = (o: O, n: ReactText[]) => {
        if (lastSingle) {
            const [i1, i2] = [lastSingle, o.id].map(i => ids.indexOf(i));
            const begin = Math.min(i1, i2);
            const end = Math.max(i1, i2);
            ids.slice(begin, end + 1).forEach(i => n.push(i));
        }
    }

    const move = (e: React.MouseEvent, o?: O) => {
        e.preventDefault();
        if (e.buttons && o) {
            const n = [...selected];
            if (e.ctrlKey) n.push(o.id);
            else selectedUntil(o, n);
            setSelected(() => n);
        }
    }

    const click = (e: React.MouseEvent, o?: O) => {
        e.preventDefault();
        e.stopPropagation();
        const { ctrlKey, shiftKey } = e;
        const preserve = ctrlKey || shiftKey;

        const n = preserve ? [...selected] : [];
        if (shiftKey) setLastSingle(undefined);
        else setLastSingle(o?.id);

        if (o) {
            n.push(o.id);
            if (shiftKey) selectedUntil(o, n)
        }
        setSelected(() => n);
    }
    const isSelected = (o: O) => selected.includes(o.id);
    const getSelected = () => models.filter(o => selected.includes(o.id));

    return { click, isSelected, getSelected, move };
}
*/

interface CellProps<T extends { name: string } & WithID> {
    selection?: ISelection<T['id']>;
    actions?: IAction[];
    model: T;
    size?: Size;
}

export const Cell = memo(function <T extends { name: string } & WithID>(props: CellProps<T> & {
    children?: JSX.Element | JSX.Element[],
    cover: IImage | IImage[],
    link?: string,
}) {
    const { selection, actions, model, children, link } = props;
    const { onContextMenu } = useContextMenu(actions);
    const selected = selection?.isSelected(model.id) ?? false;
    const size = props.size ?? Size.NORMAL;
    const cover = Array.isArray(props.cover) ? props.cover[size] : props.cover;

    const i = <>
        <Image url={cover.url} alt={model.name} />
        <h4>{model.name}</h4>
        {children}
    </>

    const c = link ? <Link to={link}>{i}</Link> : i;

    return <div
        className={classes('cell', { selected, link }, Size[size].toLowerCase())}
        {...selection?.events(model.id)}
        {...{ onContextMenu }}
    >{c}</div>
});

const Track = memo((props: CellProps<ITrack>) => {
    const { labels, album } = props.model;
    const cover = album.images;

    return <Cell {...props} cover={cover} >
        <div className='labels'>
            {labels.map(label =>
                <LabelIcon key={label.id} {...label} />
                /*<Label size={Size.SMALL} key={label.id} {...label} />*/
            )}
        </div>
    </Cell>
});

interface ISavedTrack {
    track: ITrack;
    added_at: string;
}

const sortByDate = (a: { added_at: string }, b: { added_at: string }) => {
    const [ta, tb] = [a, b]
        .map(i => i.added_at)
        .map(i => new Date(i))
        .map(d => d.getTime());
    return tb - ta;
};

enum MatchType {
    ALL,
    NONE,
    SOME,
}

function getMatches(tracks: ITrack[], label: ILabel) {
    const count = tracks.filter(t => t.labels.map(l => l.id).includes(label.id)).length;
    if (count === tracks.length) return MatchType.ALL;
    if (count > 0) return MatchType.SOME;
    return MatchType.NONE;
}


export function useEvent<E extends Event>(event: keyof WindowEventMap, listener: (e: E) => unknown) {
    useEffect(() => {
        //@ts-ignore
        window.addEventListener(event, listener);
        //@ts-ignore
        return () => window.removeEventListener(event, listener);
    })
}

export const TrackList = memo((props: { tracks: ITrack[], size?: Size, load?: () => void, loading?: boolean }) => {
    const [labels] = useApi<ILabel[]>('label');
    const { tracks, size, load, loading } = props;

    const selection = useSelection(tracks);
    const selected = useMemo(() => tracks.filter(t => selection.selected.has(t.id)), [selection.selected])
    const { close, active } = useContextMenu();

    const addLabel: ILabel[] = [];
    const removeLabel: ILabel[] = [];

    labels?.forEach(label => {
        const match = getMatches(selected, label);
        if (match !== MatchType.NONE) removeLabel.push(label);
        if (match !== MatchType.ALL) addLabel.push(label);
    })

    const actions: IAction[] = [];

    if (addLabel.length > 0) actions.push({
        display: 'Add Label', children: addLabel.map(l => ({
            display: l.name, apply: () => API.post('track/label', { label: l.id, tracks: selected.map(t => t.id) })
        }))
    });

    if (removeLabel.length > 0) actions.push({
        display: 'Remove Label', children: removeLabel.map(l => ({
            display: l.name, apply: () => API.delete('track/label', { label: l.id, tracks: selected.map(t => t.id) })
        }))
    });

    useEvent('mousewheel', (e: WheelEvent) => {
        const total = document.body.offsetHeight;
        const { innerHeight, scrollY } = window;
        const y = (innerHeight + scrollY) - total;

        if (e.deltaY > 0 && y >= -200 && !loading && load) load();
    });

    const [search, setSearch] = useState('');

    const shown = useMemo(() => tracks.filter(({ name, album, artists }) =>
        search.length == 0 || [name, album.name, ...artists.map(a => a.name)]
            .map(s => s.toLowerCase())
            .some(s => s.includes(search.toLowerCase()))
    ), [search, tracks])

    return (
        <div
            onClick={active ? close : selection.clear}
            style={{ gridArea: 'tracks' }}>

            {tracks.length > 0 && <input
                className='line'
                type='text'
                placeholder='Search'
                value={search}
                onChange={e => setSearch(e.target.value)}
            />}

            <div className='grid'>
                {shown.map(model =>
                    <Track
                        key={model.id}
                        {...{ size }}
                        {...{ model, selection, actions }}
                    />
                )}
            </div>
            {loading && <Loading relative />}
        </div >
    )

})

export type Scroller<T> = {
    loaded: T[],
    load: () => void,
    loading: boolean
};

function useScroller<T>(endpoint: string, limit: number): Scroller<T> {
    const [loaded, setLoaded] = useState<T[]>([]);
    const [loading, setLoading] = useState(false);
    const [offset, setOffset] = useState(0);

    const load = () => {
        setLoading(true);
        setOffset(o => o + limit);

        API.fetch<T[]>(endpoint, { limit, offset })
            .then(l => {
                if (l) setLoaded(o => [...o, ...l]);
                else throw new Error('No result returned');
            })
            .catch(e => console.error(e))
            .finally(() => setLoading(false));
    }

    useEffect(() => {
        load();
    }, []);

    return { loaded, load, loading };
}

function Songs() {
    const { loaded, load, loading } = useScroller<ISavedTrack>('saved', 30);

    const tracks = useMemo(() => loaded.map(item => item.track), [loaded]);

    return <TrackList {...{ tracks, load, loading }} />
}

export default Songs;