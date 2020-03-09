import API, { useApi, useLoading, Loading } from "../Api";
import React, { useState, ReactText, useMemo, useEffect } from 'react';
import { List, ITrack, ILabel } from "../models";
import classes from 'classnames';
import { Label } from './Labels'

interface WithID {
    id: ReactText,
}

interface ISelection<O extends WithID> {
    click(e: React.MouseEvent, o?: O): void,
    move(e: React.MouseEvent, o?: O): void,
    isSelected(o: O): boolean,
    getSelected(): O[],
}
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

function Track(props: { track: ITrack, size?: Size, selection: ISelection<ITrack>, openContextMenu: (p?: IPoint) => void }) {
    const { track, selection } = props;
    const { album, name, labels } = track;
    const { click, move, isSelected } = selection;
    const size = props.size ?? Size.NORMAL;
    const cover = album.images[size];
    const selected = isSelected(track);

    return (
        <div
            style={{ width: cover.width }}
            className={classes({ selected }, Size[size].toLowerCase())}
            onMouseMove={e => move(e, track)}
            onClick={e => {
                props.openContextMenu();
                click(e, track);
            }}
            onContextMenu={e => {
                const { clientX: x, clientY: y } = e;
                click(e, track);
                props.openContextMenu({ x, y })
                e.preventDefault();
            }}
        >
            <img style={{ ...cover }} draggable={false} src={cover.url} alt={`Album cover for ${album.name}`} />
            <h4>{name}</h4>
            <div className='labels'>
                {labels.map(label =>
                    <Label size={Size.SMALL} key={label.id} {...label} />
                )}
            </div>
        </div>
    )
}

interface IPoint {
    x: number;
    y: number;
}

type SongList = Array<{
    track: ITrack;
    added_at: string;
}>;

export type IAction = {
    display: string,
    className?: string,
} & ({
    apply: () => void
} | {
    children: IAction[]
})

export function ContextMenu<O>(props: { actions: IAction[], point: IPoint }) {
    const { actions, point } = props;
    const [active, setActive] = useState<IAction[]>(actions);

    useEffect(() => setActive(actions), [point]);

    function isParent(a: IAction): a is IAction & { children: IAction[] } {
        return Array.isArray((a as any).children);
    }

    return (
        <div className='contextmenu' style={{
            top: point.y,
            left: point.x,
        }}>
            {active.map((a, i) => {
                const parent = isParent(a);

                return (
                    <button
                        key={i}
                        className={classes({ parent }, a.className)}
                        onClick={e => {
                            e.stopPropagation();
                            e.preventDefault();

                            if (isParent(a)) setActive(a.children);
                            else a.apply();

                        }}>{a.display}</button>
                );
            })}
        </div>
    )
}

const sortByDate = (a: { added_at: string }, b: { added_at: string }) => {
    const [ta, tb] = [a, b]
        .map(i => i.added_at)
        .map(i => new Date(i))
        .map(d => d.getTime());
    return tb - ta;
};

export enum Size {
    SMALL = 2,
    NORMAL = 1,
    BIG = 0,
}

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

export function TrackList({ tracks, size }: { tracks: ITrack[], size?: Size }) {
    const [labels] = useApi<ILabel[]>('user/labels');

    const selection = useSelection(tracks);
    const selected = selection.getSelected();
    const ids = selected.map(t => t.id);
    const [contextMenu, openContextMenu] = useState<IPoint | undefined>();

    const addLabel: ILabel[] = [];
    const removeLabel: ILabel[] = [];

    labels?.forEach(label => {
        const match = getMatches(selected, label);
        if (match !== MatchType.NONE) removeLabel.push(label);
        if (match !== MatchType.ALL) addLabel.push(label);
    })

    const actions: IAction[] = [
        {
            display: 'Add Label', children: addLabel.map(l => ({
                display: l.name, apply: () => API.post('track/add-label', { label: l.id, tracks: ids })
            }))
        },
        {
            display: 'Remove Label', children: removeLabel.map(l => ({
                display: l.name, apply: () => API.post('track/remove-label', { label: l.id, tracks: ids })
            }))
        }
    ];

    return (
        <div onClick={e => {
            selection.click(e);
            openContextMenu(undefined);
        }} style={{ gridArea: 'tracks' }}>
            <h1>{selected.length
                ? `${selected.length} selected`
                : `${tracks.length}`
            } tracks</h1>

            {contextMenu && <ContextMenu point={contextMenu} {...{ actions }} />}

            <div className='grid'>
                {tracks && tracks.map(track =>
                    <Track
                        {...{ size }}
                        key={track.id} {...{ track, selection, openContextMenu }}
                    />
                )}
            </div>
        </div>
    )

}

function Songs() {
    const [saved, loading] = useApi<SongList>('user/saved', { limit: 50 });

    const items = saved ?? [];
    const tracks = items.map(item => item.track);

    if (loading) return <Loading />
    return <TrackList {...{ tracks }} />
}

export default Songs;