import React, { MouseEvent, useState } from 'react';

export const ColorPicker = (props: { color: string, setColor: (s: string) => void }) => {
    const { color, setColor } = props;
    const [down, setDown] = useState<number[]>();

    //const backgroundColor = `hsl(${h}, ${s}%, ${l}%)`;
    const backgroundImage = `url(${require('../img/color.png')})`;

    const click = (e: MouseEvent<HTMLElement>) => {
        const { pageX, pageY } = e;
        const { offsetHeight: h, offsetWidth: w, offsetLeft, offsetTop } = e.currentTarget;
        const cx = pageX - offsetLeft;
        const cy = pageY - offsetTop - 70;
        const x = (cx / w - 0.5) * 2;
        const y = (cy / h - 0.5) * 2;
        const atan = Math.atan2(x, y);
        const deg = Math.round(atan * 180 / Math.PI);
        setColor(toHex(270 - deg, 60, 50));
        setDown([Math.sin, Math.cos]
            .map(f => f(atan) * 0.7)
            .map(i => (i + 1) * w / 2)
        )
    }

    return (
        <div
            draggable={false}
            className='color-picker'
            onClick={click}
            onMouseMove={e => {
                if (e.buttons) click(e);
            }}
            onMouseUp={() => setDown(undefined)}
            onMouseOut={() => setDown(undefined)}
            style={{ backgroundImage }}
        >
            {down && <div onMouseMove={e => e.stopPropagation()} style={{
                backgroundColor: `#${color}`,
                left: down[0],
                top: down[1]
            }} />}
        </div>
    );
}

function toHex(h: number, s: number, l: number) {
    h /= 360;
    s /= 100;
    l /= 100;
    let r, g, b;
    if (s === 0) {
        r = g = b = l;
        // achromatic
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    const toHex = (x: number) => {
        const hex = Math.round(x * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return `${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function toHSL(hex?: string) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex ?? '')?.slice(1);
    if (!result) return [0, 0, 0]

    const [r, g, b] = result.map(s => Number.parseInt(s, 16) / 255);

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        // achromatic
        h = s = 0;
    } else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
            default: h = 0;
        }
        h /= 6;
    }

    s = s * 100;
    s = Math.round(s);
    l = l * 100;
    l = Math.round(l);
    h = Math.round(360 * h);

    return [h, s, l];
}