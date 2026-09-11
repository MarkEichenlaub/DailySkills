import { InterleavedSkill, numberInput, randInt, choice, gradeWithin, gradeWithinPercent } from './base.js';
import { svg, line, text, polygon, polyline, circle, rect, arrow, INK, ACCENT, MUTED, FILL } from './draw.js';

const W = 340;
const H = 300;

// ---------------------------------------------------------------- line length

// A reference segment of known length sits above an unknown one. You judge the
// unknown against the reference, which is what you actually do in the world -
// nobody estimates in pixels.
function makeLineLength() {
    const refPx = randInt(70, 130);
    const refUnits = choice([10, 20, 50, 100]);
    const ratio = 0.4 + Math.random() * 2.2;
    const targetPx = Math.min(300, Math.round(refPx * ratio));
    const answer = refUnits * (targetPx / refPx);

    // Draw the unknown at an angle so it can't be compared edge-to-edge.
    const ang = (Math.random() * 140 - 70) * Math.PI / 180;
    const cx = W / 2, cy = 200;
    const dx = targetPx / 2 * Math.cos(ang), dy = targetPx / 2 * Math.sin(ang);

    const body =
        line(20, 60, 20 + refPx, 60, MUTED, 3) +
        line(20, 52, 20, 68, MUTED, 2) +
        line(20 + refPx, 52, 20 + refPx, 68, MUTED, 2) +
        text(20 + refPx / 2, 44, `${refUnits}`, 'middle', 13, MUTED) +
        line(cx - dx, cy - dy, cx + dx, cy + dy, ACCENT, 3);

    return {
        question: 'How long is the red segment, in the same units as the gray reference?',
        inputHTML: svg(W, H, body) + numberInput('units'),
        correctAnswer: answer,
    };
}

function checkLineLength(trial, answer) {
    return gradeWithinPercent(parseFloat(answer), trial.correctAnswer, 12,
        v => v.toFixed(1));
}

// ------------------------------------------------------------ fraction shaded

// A square filled up to a wavy boundary. The exact fraction comes from
// integrating the boundary, so the answer is never a round number you could
// guess from the shape of the question.
function makeFraction() {
    const base = 0.25 + Math.random() * 0.5;
    const a1 = 0.05 + Math.random() * 0.12, k1 = 1 + Math.random() * 2.5, p1 = Math.random() * 6.3;
    const a2 = 0.03 + Math.random() * 0.08, k2 = 2 + Math.random() * 4, p2 = Math.random() * 6.3;
    const h = (t) => Math.max(0.02, Math.min(0.98,
        base + a1 * Math.sin(k1 * 2 * Math.PI * t + p1) + a2 * Math.sin(k2 * 2 * Math.PI * t + p2)));

    const N = 200;
    let area = 0;
    for (let i = 0; i < N; i++) area += h((i + 0.5) / N);
    area /= N;

    const size = 240;
    const x0 = (W - size) / 2, y0 = 30;
    const pts = [];
    for (let i = 0; i <= N; i++) {
        const t = i / N;
        pts.push([x0 + t * size, y0 + size * (1 - h(t))]);
    }
    pts.push([x0 + size, y0 + size], [x0, y0 + size]);

    const body = polygon(pts, FILL, 0.6) + rect(x0, y0, size, size, INK);

    return {
        question: 'What percentage of the square is shaded?',
        inputHTML: svg(W, size + 60, body) + numberInput('%'),
        correctAnswer: area * 100,
    };
}

function checkFraction(trial, answer) {
    return gradeWithin(parseFloat(answer), trial.correctAnswer, 7,
        v => v.toFixed(1) + '%');
}

// ------------------------------------------------------------- read off graph

// Axes with labeled ticks, a curve, and a dashed line dropped at one x. The
// point is reading between gridlines, so the asked-for x never sits on a tick.
function makeReadGraph() {
    const xMax = choice([10, 20, 50, 100]);
    const yMax = choice([10, 20, 50, 100, 200]);
    const kind = choice(['linear', 'quad', 'exp', 'sqrt']);
    const scale = 0.35 + Math.random() * 0.6;
    const f = {
        linear: t => scale * t,
        quad: t => scale * t * t,
        exp: t => scale * (Math.exp(2.2 * t) - 1) / (Math.exp(2.2) - 1),
        sqrt: t => scale * Math.sqrt(t),
    }[kind];

    const px = 46, py = 30, pw = W - 70, ph = 210;
    const X = t => px + t * pw;
    const Y = v => py + ph - Math.min(1, v) * ph;

    const pts = [];
    for (let i = 0; i <= 120; i++) {
        const t = i / 120;
        pts.push([X(t), Y(f(t))]);
    }

    const askT = 0.15 + Math.random() * 0.7;
    const askX = askT * xMax;
    const answer = f(askT) * yMax;

    let ticks = '';
    for (let i = 0; i <= 5; i++) {
        const t = i / 5;
        ticks += line(X(t), py + ph, X(t), py + ph + 5, INK, 1);
        ticks += text(X(t), py + ph + 19, String(Math.round(t * xMax)), 'middle', 11, INK);
        ticks += line(px - 5, Y(t), px, Y(t), INK, 1);
        ticks += text(px - 9, Y(t) + 4, String(Math.round(t * yMax)), 'end', 11, INK);
        if (i > 0) ticks += line(px, Y(t), px + pw, Y(t), '#ecf0f1', 1);
    }

    const body =
        ticks +
        line(px, py, px, py + ph, INK, 1.5) +
        line(px, py + ph, px + pw, py + ph, INK, 1.5) +
        polyline(pts, ACCENT, 2.5) +
        line(X(askT), py + ph, X(askT), py, MUTED, 1.5, '4 4');

    return {
        question: `Read the curve: what is y when x = ${askX.toFixed(1)}?`,
        inputHTML: svg(W, ph + 70, body) + numberInput('y'),
        correctAnswer: answer,
        _yMax: yMax,
    };
}

function checkReadGraph(trial, answer) {
    // Tolerance is a slice of the axis range, not of the value - reading 2 off
    // a 200-tall axis is the same eyeball skill as reading 150 off it.
    return gradeWithin(parseFloat(answer), trial.correctAnswer, trial._yMax * 0.06,
        v => v.toFixed(1));
}

// --------------------------------------------------------------- log-log slope

// A power law on log-log axes. Reading the exponent straight off the slope is
// constant work in physics and nobody is good at it without practice.
function makeLogLogSlope() {
    const slope = choice([-2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2, 3, -3, 2.5]);
    const decX = 3, decY = 4;
    const px = 50, py = 26, pw = W - 74, ph = 200;
    const X = d => px + (d / decX) * pw;
    const Y = d => py + ph - (d / decY) * ph;

    // Pin the line through a point that keeps it on screen for any slope.
    const midX = 1.5;
    const midY = 1 + Math.random() * 2;
    const at = d => midY + slope * (d - midX);

    // Clip to the visible decades.
    let d0 = 0, d1 = decX;
    for (let i = 0; i <= 300; i++) {
        const d = (i / 300) * decX;
        if (at(d) >= 0 && at(d) <= decY) { d0 = d; break; }
    }
    for (let i = 300; i >= 0; i--) {
        const d = (i / 300) * decX;
        if (at(d) >= 0 && at(d) <= decY) { d1 = d; break; }
    }

    let grid = '';
    for (let d = 0; d <= decX; d++) {
        grid += line(X(d), py, X(d), py + ph, '#ecf0f1', 1);
        grid += text(X(d), py + ph + 18, `10<tspan baseline-shift="super" font-size="8">${d}</tspan>`, 'middle', 11, INK);
    }
    for (let d = 0; d <= decY; d++) {
        grid += line(px, Y(d), px + pw, Y(d), '#ecf0f1', 1);
        grid += text(px - 8, Y(d) + 4, `10<tspan baseline-shift="super" font-size="8">${d}</tspan>`, 'end', 11, INK);
    }

    const body = grid +
        line(px, py, px, py + ph, INK, 1.5) +
        line(px, py + ph, px + pw, py + ph, INK, 1.5) +
        line(X(d0), Y(at(d0)), X(d1), Y(at(d1)), ACCENT, 2.5);

    return {
        question: 'These are log-log axes. What is the slope of the line?',
        inputHTML: svg(W, ph + 66, body) + numberInput('slope', '0.1'),
        correctAnswer: slope,
    };
}

function checkLogLogSlope(trial, answer) {
    return gradeWithin(parseFloat(answer), trial.correctAnswer, 0.25,
        v => v.toFixed(2));
}

// ------------------------------------------------------------------ vector sum

// Two arrows from a common origin. You give the direction of the resultant,
// measured counterclockwise from the +x axis.
function makeVectorSum() {
    const a1 = Math.random() * 360, a2 = Math.random() * 360;
    const r1 = 55 + Math.random() * 60, r2 = 55 + Math.random() * 60;
    const rad = d => d * Math.PI / 180;
    const sx = r1 * Math.cos(rad(a1)) + r2 * Math.cos(rad(a2));
    const sy = r1 * Math.sin(rad(a1)) + r2 * Math.sin(rad(a2));
    const mag = Math.hypot(sx, sy);
    // Too short a resultant makes the direction a coin flip rather than a read.
    if (mag < 45) return makeVectorSum();
    let answer = Math.atan2(sy, sx) * 180 / Math.PI;
    if (answer < 0) answer += 360;

    const cx = W / 2, cy = 155;
    const body =
        line(20, cy, W - 20, cy, '#ecf0f1', 1) +
        line(cx, 20, cx, 290, '#ecf0f1', 1) +
        text(W - 26, cy - 7, '+x', 'end', 11, MUTED) +
        arrow(cx, cy, cx + r1 * Math.cos(rad(a1)), cy - r1 * Math.sin(rad(a1)), INK) +
        arrow(cx, cy, cx + r2 * Math.cos(rad(a2)), cy - r2 * Math.sin(rad(a2)), INK);

    return {
        question: 'In what direction does the sum of these two vectors point? (degrees counterclockwise from +x)',
        inputHTML: svg(W, 300, body) + numberInput('degrees'),
        correctAnswer: answer,
    };
}

function checkVectorSum(trial, answer) {
    const user = parseFloat(answer);
    const correct = trial.correctAnswer;
    if (!isFinite(user)) return { score: 0, correct: false, feedback: `Answer: ${correct.toFixed(0)}°` };
    // Angles wrap, so 358 and 2 are four degrees apart.
    let diff = Math.abs(user - correct) % 360;
    if (diff > 180) diff = 360 - diff;
    const isCorrect = diff <= 12;
    const score = diff <= 12 ? 1 : diff <= 25 ? 0.6 : diff <= 45 ? 0.3 : 0;
    return {
        score, correct: isCorrect,
        feedback: isCorrect
            ? `${correct.toFixed(0)}° (you said ${user.toFixed(0)}°, off by ${diff.toFixed(0)}°)`
            : `Off by ${diff.toFixed(0)}°. Correct answer: ${correct.toFixed(0)}° (you said ${user.toFixed(0)}°)`,
    };
}

// ---------------------------------------------------------------- count by eye

function makeCount() {
    const n = randInt(18, 130);
    let dots = '';
    for (let i = 0; i < n; i++) {
        dots += circle(14 + Math.random() * (W - 28), 14 + Math.random() * (H - 28), 3.2, INK);
    }
    return {
        question: 'Roughly how many dots are there? (no time to count them all)',
        inputHTML: svg(W, H, rect(4, 4, W - 8, H - 8, '#ecf0f1') + dots) + numberInput('count'),
        correctAnswer: n,
    };
}

function checkCount(trial, answer) {
    return gradeWithinPercent(parseFloat(answer), trial.correctAnswer, 15,
        v => v.toFixed(0));
}

// -------------------------------------------------------------------- assembly

export class EstimationSkill extends InterleavedSkill {
    constructor() {
        super('estimate-by-eye', 'Estimating by Eye', [
            { tag: 'line', name: 'Length', make: makeLineLength, check: checkLineLength },
            { tag: 'fraction', name: 'Fraction shaded', make: makeFraction, check: checkFraction },
            { tag: 'graph', name: 'Reading a graph', make: makeReadGraph, check: checkReadGraph },
            { tag: 'loglog', name: 'Log-log slope', make: makeLogLogSlope, check: checkLogLogSlope },
            { tag: 'vector', name: 'Vector sum', make: makeVectorSum, check: checkVectorSum },
            { tag: 'count', name: 'Counting', make: makeCount, check: checkCount },
        ]);
    }
}
