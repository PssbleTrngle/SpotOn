import { useState, useMemo } from 'react';
import { IModel, WithID } from './models';
import { useEvent } from './components/Songs';
import { useContextMenu } from './components/ContextMenu';

export interface ISelection<ID> {
    isSelected(id: ID): boolean;
    selected: Set<ID>;
    clear: () => void;
    events(id: ID): {
        onMouseDown(e: React.MouseEvent): void;
        onMouseUp(e: React.MouseEvent): void;
        onMouseMove(e: React.MouseEvent): void;
        onClick(e: React.MouseEvent): void;
    }
}

export default function useSelection<T extends WithID>(models: T[]): ISelection<T['id']> {
    type ID = T['id'];
    const { active } = useContextMenu();

    const [selected, setSelected] = useState<Set<ID>>(new Set());
    const [saved, setSaved] = useState<Set<ID>>(new Set());
    const [last, setLast] = useState<number>();

    const ids = useMemo(() => models.map(m => m.id), [models]);

    const isSelected = (m: T | ID) => {
        const id = typeof m === 'object' ? m.id : m;
        return selected.has(id);
    }

    const clear = () => {
        setLast(undefined);
        setSaved(new Set());
        setSelected(new Set());
    }

    useEvent('keyup', (e: KeyboardEvent) => {
        if (!active && e.keyCode === 27) clear();
    })

    const events = (id: ID) => {
        const index = ids.indexOf(id);
        const is = isSelected(id);

        return {
            onClick: (e :React.MouseEvent) => e.stopPropagation(),
            onMouseDown: (e: React.MouseEvent) => {
                if (e.button === 0) {
                    e.preventDefault();
                    e.stopPropagation();

                    const preserve = e.shiftKey || e.ctrlKey;
                    const n = preserve ? new Set(saved) : new Set<ID>();

                    if (is && e.ctrlKey) {
                        n.delete(id);
                    } else {
                        n.add(id);
                    }

                    if (!e.shiftKey) {
                        setLast(index);
                        setSaved(n);
                    }

                    setSelected(n);
                }
            },
            onMouseUp: (e: React.MouseEvent) => {
                if (e.button === 0) {
                    e.preventDefault();
                    e.stopPropagation();

                    const shift = e.shiftKey;

                    setSelected(old => {
                        const n = new Set(old);

                        if (shift && last !== undefined) {
                            const lower = Math.min(last, index);
                            const upper = Math.max(last, index);
                            for (let i = lower; i <= upper; i++) n.add(ids[i]);
                        }

                        return n;
                    })
                }
            },
            onMouseMove: (e: React.MouseEvent) => {
                e.preventDefault();
                if (e.buttons) {
                    const n = new Set(saved);
                    if (last !== undefined) {
                        const lower = Math.min(last, index);
                        const upper = Math.max(last, index);
                        for (let i = lower; i <= upper; i++) n.add(ids[i]);
                    }

                    setSelected(n);
                }
            }
        }
    };

    return { selected, isSelected, events, clear };
}