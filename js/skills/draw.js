// Small SVG helpers shared by the drawing-based skills.
//
// Everything is built as an SVG string rather than a canvas. A canvas element
// serialized with outerHTML loses whatever was painted into it, so anything
// drawn that way arrives on screen blank.

export const INK = '#2c3e50';
export const ACCENT = '#e74c3c';
export const MUTED = '#95a5a6';
export const FILL = '#3498db';

export function svg(width, height, body, extraClass = '') {
    return `<svg class="figure ${extraClass}" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img">${body}</svg>`;
}

export function line(x1, y1, x2, y2, stroke = INK, w = 2, dash = null) {
    const d = dash ? ` stroke-dasharray="${dash}"` : '';
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${w}"${d} stroke-linecap="round"/>`;
}

export function text(x, y, str, anchor = 'middle', size = 12, fill = INK) {
    return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}" fill="${fill}" font-family="system-ui, sans-serif">${str}</text>`;
}

export function polygon(points, fill = FILL, opacity = 0.55) {
    return `<polygon points="${points.map(p => p.join(',')).join(' ')}" fill="${fill}" fill-opacity="${opacity}"/>`;
}

export function polyline(points, stroke = ACCENT, w = 2.5) {
    return `<polyline points="${points.map(p => p.join(',')).join(' ')}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round"/>`;
}

export function circle(cx, cy, r, fill = INK) {
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;
}

export function rect(x, y, w, h, stroke = INK, fill = 'none') {
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" stroke="${stroke}" fill="${fill}" stroke-width="1.5"/>`;
}

// An arrow from (x1,y1) to (x2,y2), head drawn as part of the path so no
// marker definitions are needed.
export function arrow(x1, y1, x2, y2, stroke = INK, w = 2.5) {
    const ang = Math.atan2(y2 - y1, x2 - x1);
    const head = 10;
    const spread = 0.4;
    const hx1 = x2 - head * Math.cos(ang - spread);
    const hy1 = y2 - head * Math.sin(ang - spread);
    const hx2 = x2 - head * Math.cos(ang + spread);
    const hy2 = y2 - head * Math.sin(ang + spread);
    return line(x1, y1, x2, y2, stroke, w) +
        `<polygon points="${x2},${y2} ${hx1},${hy1} ${hx2},${hy2}" fill="${stroke}"/>`;
}
