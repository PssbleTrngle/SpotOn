import classes from 'classnames';
import React from 'react';
import { Link, useLocation } from "react-router-dom";

function Navbar() {
    const path = useLocation().pathname;

    const links = [
        { to: '/songs', display: 'Songs' },
        { to: '/labels', display: 'Labels' },
        { to: '/playlists', display: 'Playlists' },
    ]

    return (
        <nav>
            {links.map(({ to, display }) =>
                <Link className={classes({ active: path.startsWith(to) })} key={to} {...{ to }}>
                    <span>{display}</span>
                </Link>
            )}
        </nav>
    )
}

export default Navbar;