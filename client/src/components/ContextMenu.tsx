import React, { useContext, Dispatch, SetStateAction, useState, useEffect } from "react";
import classes from 'classnames';

interface ContextMenuProps {
    point: IPoint;
    actions: IAction[];
}

interface IPoint {
    x: number;
    y: number;
}

export type IAction = {
    display: string,
    className?: string,
} & ({
    apply: () => void
} | {
    children: IAction[]
})

type State<T> = [T, Dispatch<SetStateAction<T>>];
const ContextMenuContext = React.createContext<State<ContextMenuProps | null>>([null, () => { }]);

export function useContextMenu(actions?: IAction[]) {
    const [current, setCurrent] = useContext(ContextMenuContext);

    return {
        onContextMenu: (e: React.MouseEvent) => {
            const { clientX: x, clientY: y } = e;
            e.preventDefault();
            if (actions) setCurrent({ point: { x, y }, actions })
        },
        close: () => setCurrent(null),
        active: !!current,
    }
}

export const ContextMenu = ({ actions, point }: ContextMenuProps) => {
    const [active, setActive] = useState<IAction[]>(actions);
    const { close } = useContextMenu();

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
                            else {
                                close();
                                a.apply();
                            }

                        }}>{a.display}</button>
                );
            })}
        </div>
    )
}

export const Provider = ContextMenuContext.Provider;

export function useContextMenuProvider() {
    return useState<ContextMenuProps | null>(null);
}