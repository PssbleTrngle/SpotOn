import {
    faBirthdayCake, faDrum, faEdit, faBomb, faHeadphones, faMusic, faPlus, faQuestion, faAtom, faSave, faTrash, faGuitar, faRecordVinyl, faCompactDisc, faGlassCheers, faBiohazard, faBolt, faBrain,
    faBurn, faCannabis, faCandyCane,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon as Icon } from '@fortawesome/react-fontawesome';
import classes from 'classnames';
import React, { InputHTMLAttributes, memo, MouseEvent, useEffect, useMemo, useState } from 'react';
import { Link, useHistory, useLocation, useParams } from "react-router-dom";
import { CSSTransition } from 'react-transition-group';
import API, { Loading, useApi, useLoading, useSubmit } from "../Api";
import { ILabel } from "../models";
import { ColorPicker } from './Color';
import { useDialog } from './Dialog';
import { Size, TrackList } from "./Songs";
import { library } from '@fortawesome/fontawesome'

const I = [
    faMusic, faBirthdayCake, faDrum, faHeadphones, faGuitar, faRecordVinyl, faCompactDisc, faGlassCheers,
    faBiohazard, faAtom, faBolt, faBrain, faBomb, faBurn, faCannabis, faCandyCane,
];
//@ts-ignore
library.add(...I, faQuestion);
const ICONS = I.map(i => i.iconName).sort(() => Math.random() - 0.5);

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

export const LabelIcon = memo(({ icon, color, cycleIcon, name }: ILabel & { cycleIcon?: () => void }) => {

    const displayIcon = icon ?? faQuestion.iconName;

    return (
        <span className='label-icon' style={{ backgroundColor: `#${color}` }} title={name}>
            <Icon
                icon={displayIcon}
                role={cycleIcon ? 'button' : undefined}
                onClick={e => {
                    e.preventDefault();
                    if (cycleIcon) cycleIcon();
                }}
            />
        </span>
    );
})

export const Label = memo((props: ILabel & { size?: Size, edit?: boolean }) => {
    const { color, id, edit, icon } = props;

    const [name, setName] = useState('');
    const { post, valid, inProgress } = useSubmit('put', `label/${id}`, { name, color, icon })

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
        if (valid) API.post('label', { name });
    }

    return (
        <div>
            <input
                className={classes('group', { invalid })}
                type='text'
                placeholder='New Label'
                value={name}
                onChange={e => change(e.target.value)}
            />
            <button className='group primary' type='submit' onClick={create}>
                <Icon icon={faPlus} />
            </button>
        </div>
    )
}

const View = ({ id }: { id: string }) => {
    const [c1, setColor] = useState<string>()

    const [i1, setIcon] = useState<number>();
    const cycleIcon = () => setIcon(i => ((i ?? 0) + 1) % ICONS.length);

    const [edit, setEdit] = useState(false);
    const toggleEdit = () => setEdit(!edit);
    useEffect(() => {
        if (!edit) {
            setColor(undefined);
            setIcon(undefined);
        }
    }, [edit]);

    const { open } = useDialog();
    const history = useHistory();

    const [l, loading] = useApi<ILabel>(`label/${id}`);

    useEffect(() => {
        if (l) setColor(l.color);
    }, [l])

    if (loading) return <Loading />
    if (!l) return <span>Not found</span>

    const { tracks, color: c2, icon: i2, ...label } = l;
    const color = c1 ?? c2;
    const icon = i1 !== undefined ? ICONS[i1] : i2;

    const askDelete = () => open({
        text: 'Delete label?', action: () => {
            API.delete(`label/${id}`)
                .then(() => history.push('/labels'))
        }
    });

    return <>
        <div className='title'>

            <LabelIcon {...label} cycleIcon={edit ? cycleIcon : undefined} {...{ color, icon }} />
            <Label size={Size.BIG} {...label} {...{ color, edit, icon }} />

            <button onClick={toggleEdit}>
                <Icon icon={faEdit} />
            </button>

            {edit && <button onClick={askDelete} className='red'>
                <Icon icon={faTrash} />
            </button>}

        </div>

        <CSSTransition in={edit} timeout={300}>
            <ColorPicker {...{ color, setColor }} />
        </CSSTransition>

        {tracks && <TrackList {...{ tracks }} />}
    </>
}

function LabelList() {
    return useLoading<ILabel[]>('label', labels => <div>
        <Creator />
        <ul>
            {labels.map(label => <Label key={label.id} {...label} />)}
        </ul>
    </div>)
}

function Labels() {
    const { id } = useParams();

    if (id) return <View {...{ id }} />
    return <LabelList />
}

export default Labels;