import classes from 'classnames';
import React, { memo, ReactText, useEffect, useMemo, useState } from 'react';
import { Link } from "react-router-dom";
import API, { Loading, useApi } from "../Api";
import { IImage, ILabel, ITrack } from "../models";
import { Image } from './App';
import { Label } from './Labels';

interface WithID {
    id: ReactText,
}

export enum Size {
    SMALL = 2,
    NORMAL = 1,
    BIG = 0,
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

interface CellProps<T extends { name: string } & WithID> {
    selection?: ISelection<T>;
    openContextMenu?: (p?: IPoint) => void;
    model: T;
    size?: Size;
}

export const Cell = memo(function <T extends { name: string } & WithID>(props: CellProps<T> & {
    children?: JSX.Element | JSX.Element[],
    cover: IImage | IImage[],
    link?: string,
}) {
    const { selection, openContextMenu, model, children, link } = props;
    const selected = selection?.isSelected(model) ?? false;
    const size = props.size ?? Size.NORMAL;
    const cover = Array.isArray(props.cover) ? props.cover[size] : props.cover;

    const i = <>
        <Image {...cover} alt={model.name} />
        <h4>{model.name}</h4>
        {children}
    </>

    const c = link ? <Link to={link}>{i}</Link> : i;

    return <div
        style={{ width: cover.width }}
        className={classes('cell', { selected, link }, Size[size].toLowerCase())}
        onMouseMove={e => selection?.move(e, model)}
        onClick={e => {
            if (openContextMenu) openContextMenu();
            selection?.click(e, model);
        }}
        onContextMenu={e => {
            const { clientX: x, clientY: y } = e;
            if (openContextMenu) openContextMenu({ x, y })
            selection?.click(e, model);
            e.preventDefault();
        }}
    >{c}</div>
});

const Track = memo((props: CellProps<ITrack>) => {
    const { labels, album } = props.model;
    const cover = album.images;

    return <Cell {...props} cover={cover} >
        <div className='labels'>
            {labels.map(label =>
                <Label size={Size.SMALL} key={label.id} {...label} />
            )}
        </div>
    </Cell>
});

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

export const ContextMenu = (props: { actions: IAction[], point: IPoint }) => {
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

export const TrackList = memo(({ tracks, size }: { tracks: ITrack[], size?: Size }) => {
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
                {tracks && tracks.map(model =>
                    <Track
                        key={model.id}
                        {...{ size }}
                        {...{ model, selection, openContextMenu }}
                    />
                )}
            </div>
        </div>
    )

});

function Songs() {
    const [saved, loading] = useApi<SongList>('user/saved', { limit: 50 });

    const items = saved ?? [];
    const tracks = items.map(item => item.track);

    if (loading) return <Loading />
    return <TrackList {...{ tracks }} />
}

export default Songs;