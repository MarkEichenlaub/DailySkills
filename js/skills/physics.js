import { InterleavedSkill, numberInput, choiceInput, randInt, choice, gradeWithin, gradeWithinPercent } from './base.js';

// The arithmetic and recall that sit underneath physics problems: powers of ten,
// the constants, the conversions, and whether an expression can even be right on
// dimensional grounds.

// Accepts 1.8e12, 1.8E12, 1.8x10^12, 1.8*10^12, 1.8×10^12, or a plain number.
export function parseSci(str) {
    if (str == null) return NaN;
    let s = String(str).trim().replace(/\s+/g, '').replace(/×/g, 'x');
    const m = s.match(/^([-+]?[\d.]+)[x*]10\^?([-+]?\d+)$/i);
    if (m) return parseFloat(m[1]) * Math.pow(10, parseInt(m[2], 10));
    // The caret is required here: without it "1048576" would read as 10^48576.
    const m2 = s.match(/^10\^([-+]?\d+)$/i);
    if (m2) return Math.pow(10, parseInt(m2[1], 10));
    return parseFloat(s);
}

function fmtSci(v) {
    if (v === 0) return '0';
    const exp = Math.floor(Math.log10(Math.abs(v)));
    if (exp >= -2 && exp <= 4) return String(Number(v.toPrecision(4)));
    const mant = v / Math.pow(10, exp);
    return `${mant.toFixed(3)}e${exp}`;
}

const SCI_INPUT = '<input type="text" id="answerInput" placeholder="e.g. 1.8e12" autocomplete="off">';

// ------------------------------------------------------------- powers of ten

function makePowers() {
    const m1 = randInt(11, 98) / 10, e1 = randInt(-12, 12);
    const m2 = randInt(11, 98) / 10, e2 = randInt(-12, 12);
    const op = choice(['×', '÷']);
    const a = m1 * Math.pow(10, e1), b = m2 * Math.pow(10, e2);
    const answer = op === '×' ? a * b : a / b;
    return {
        question: `(${m1} × 10^${e1}) ${op} (${m2} × 10^${e2}) = ?`,
        inputHTML: SCI_INPUT,
        correctAnswer: answer,
    };
}

function checkSci(trial, answer) {
    return gradeWithinPercent(parseSci(answer), trial.correctAnswer, 5, fmtSci);
}

// --------------------------------------------------------- unit conversions

const PHYS_UNITS = [
    { from: 'eV', to: 'J', f: 1.602176634e-19, lo: 1, hi: 500 },
    { from: 'J', to: 'eV', f: 1 / 1.602176634e-19, lo: 1, hi: 20 },
    { from: 'atm', to: 'Pa', f: 101325, lo: 1, hi: 50 },
    { from: 'bar', to: 'Pa', f: 1e5, lo: 1, hi: 60 },
    { from: 'ångström', to: 'm', f: 1e-10, lo: 1, hi: 90 },
    { from: 'light years', to: 'm', f: 9.4607e15, lo: 1, hi: 40 },
    { from: 'AU', to: 'm', f: 1.495979e11, lo: 1, hi: 40 },
    { from: 'atomic mass units', to: 'kg', f: 1.66054e-27, lo: 1, hi: 240 },
    { from: 'calories', to: 'J', f: 4.184, lo: 5, hi: 900 },
    { from: 'kWh', to: 'J', f: 3.6e6, lo: 1, hi: 50 },
    { from: 'mmHg', to: 'Pa', f: 133.322, lo: 10, hi: 760 },
    { from: 'MeV', to: 'J', f: 1.602176634e-13, lo: 1, hi: 940 },
];

function makePhysUnit() {
    const c = choice(PHYS_UNITS);
    const value = randInt(c.lo, c.hi);
    return {
        question: `${value} ${c.from} = ? ${c.to}`,
        inputHTML: SCI_INPUT,
        correctAnswer: value * c.f,
    };
}

// -------------------------------------------------------------- constants

const CONSTANTS = [
    { name: 'the speed of light', sym: 'c', v: 2.998e8, unit: 'm/s' },
    { name: 'the gravitational constant', sym: 'G', v: 6.674e-11, unit: 'N·m²/kg²' },
    { name: "Boltzmann's constant", sym: 'k_B', v: 1.381e-23, unit: 'J/K' },
    { name: "Planck's constant", sym: 'h', v: 6.626e-34, unit: 'J·s' },
    { name: 'the reduced Planck constant', sym: 'ħ', v: 1.055e-34, unit: 'J·s' },
    { name: "Avogadro's number", sym: 'N_A', v: 6.022e23, unit: '1/mol' },
    { name: 'the elementary charge', sym: 'e', v: 1.602e-19, unit: 'C' },
    { name: 'the permittivity of free space', sym: 'ε₀', v: 8.854e-12, unit: 'F/m' },
    { name: 'the permeability of free space', sym: 'μ₀', v: 1.257e-6, unit: 'T·m/A' },
    { name: 'the gas constant', sym: 'R', v: 8.314, unit: 'J/(mol·K)' },
    { name: 'the Stefan-Boltzmann constant', sym: 'σ', v: 5.670e-8, unit: 'W/(m²·K⁴)' },
    { name: 'the electron mass', sym: 'm_e', v: 9.109e-31, unit: 'kg' },
    { name: 'the proton mass', sym: 'm_p', v: 1.673e-27, unit: 'kg' },
    { name: 'the Bohr radius', sym: 'a₀', v: 5.292e-11, unit: 'm' },
    { name: "Earth's radius", sym: 'R⊕', v: 6.371e6, unit: 'm' },
    { name: "Earth's mass", sym: 'M⊕', v: 5.972e24, unit: 'kg' },
    { name: "the Sun's mass", sym: 'M☉', v: 1.989e30, unit: 'kg' },
    { name: "the Sun's radius", sym: 'R☉', v: 6.957e8, unit: 'm' },
    { name: 'the Earth-Sun distance', sym: '1 AU', v: 1.496e11, unit: 'm' },
];

function makeConstant() {
    const c = choice(CONSTANTS);
    return {
        question: `To one significant figure, what is ${c.name} (${c.sym}) in ${c.unit}?`,
        inputHTML: SCI_INPUT,
        correctAnswer: c.v,
    };
}

function checkConstant(trial, answer) {
    // One significant figure is the target, so anything inside 20% counts.
    return gradeWithinPercent(parseSci(answer), trial.correctAnswer, 20, fmtSci);
}

// ---------------------------------------------------------- dimensional check

// Each entry is a real relation plus a broken version of it. The broken ones
// fail on dimensions alone, so no physics knowledge beyond units is needed.
const DIMENSIONS = [
    { legend: 'v speed, a acceleration, t time', ok: 'v = a t', bad: 'v = a t²' },
    { legend: 'x distance, a acceleration, t time', ok: 'x = ½ a t²', bad: 'x = ½ a t' },
    { legend: 'F force, m mass, v speed, r radius', ok: 'F = m v² / r', bad: 'F = m v / r²' },
    { legend: 'E energy, m mass, v speed', ok: 'E = ½ m v²', bad: 'E = ½ m v' },
    { legend: 'T period, L length, g gravity', ok: 'T = 2π √(L/g)', bad: 'T = 2π √(g/L)' },
    { legend: 'T period, m mass, k spring constant', ok: 'T = 2π √(m/k)', bad: 'T = 2π √(k/m)' },
    { legend: 'p pressure, ρ density, g gravity, h depth', ok: 'p = ρ g h', bad: 'p = ρ g / h' },
    { legend: 'λ wavelength, h Planck, p momentum', ok: 'λ = h / p', bad: 'λ = h p' },
    { legend: 'E energy, h Planck, f frequency', ok: 'E = h f', bad: 'E = h / f' },
    { legend: 'P power, F force, v speed', ok: 'P = F v', bad: 'P = F / v' },
    { legend: 'a acceleration, v speed, r radius', ok: 'a = v² / r', bad: 'a = v / r²' },
    { legend: 'I moment of inertia, m mass, r radius', ok: 'I = m r²', bad: 'I = m r' },
    { legend: 'v wave speed, T tension, μ mass per length', ok: 'v = √(T/μ)', bad: 'v = √(μ/T)' },
    { legend: 'v speed, f frequency, λ wavelength', ok: 'v = f λ', bad: 'v = f / λ' },
    { legend: 'E energy, m mass, c speed of light', ok: 'E = m c²', bad: 'E = m c' },
    { legend: 'KE kinetic energy, p momentum, m mass', ok: 'KE = p² / (2m)', bad: 'KE = p / (2m)' },
    { legend: 'ω angular frequency, g gravity, L length', ok: 'ω = √(g/L)', bad: 'ω = √(L/g)' },
    { legend: 'τ torque, I moment of inertia, α angular acceleration', ok: 'τ = I α', bad: 'τ = I / α' },
    { legend: 'E field, k Coulomb constant, q charge, r distance', ok: 'E = k q / r²', bad: 'E = k q / r³' },
    { legend: 'U energy, k spring constant, x displacement', ok: 'U = ½ k x²', bad: 'U = ½ k x' },
];

function makeDimension() {
    const d = choice(DIMENSIONS);
    const consistent = Math.random() < 0.5;
    const expr = consistent ? d.ok : d.bad;
    return {
        question: `Is this dimensionally consistent?   ${expr}`,
        inputHTML: `<div class="legend">${d.legend}</div>` + choiceInput(['Consistent', 'Not consistent']),
        correctAnswer: consistent ? 0 : 1,
        _right: d.ok,
        _consistent: consistent,
    };
}

function checkDimension(trial, answer) {
    const picked = parseInt(answer, 10);
    const isCorrect = picked === trial.correctAnswer;
    const feedback = trial._consistent
        ? 'That one checks out.'
        : `Not consistent — the real relation is ${trial._right}.`;
    return { score: isCorrect ? 1 : 0, correct: isCorrect, feedback };
}

// -------------------------------------------------------------- logs and roots

function makeLog() {
    const kind = choice(['log10', 'ln', 'pow2', 'exp']);
    if (kind === 'log10') {
        const n = randInt(2, 9) * Math.pow(10, randInt(0, 6));
        return { question: `log₁₀(${n}) = ?`, inputHTML: numberInput('value', '0.01'), correctAnswer: Math.log10(n), _tol: 0.1 };
    }
    if (kind === 'ln') {
        const n = randInt(2, 200);
        return { question: `ln(${n}) = ?`, inputHTML: numberInput('value', '0.01'), correctAnswer: Math.log(n), _tol: 0.12 };
    }
    if (kind === 'pow2') {
        const n = randInt(6, 22);
        return { question: `2^${n} = ? (within a few percent is fine)`, inputHTML: SCI_INPUT, correctAnswer: Math.pow(2, n), _pct: 5 };
    }
    const x = randInt(-30, 30) / 10;
    return { question: `e^${x} = ?`, inputHTML: SCI_INPUT, correctAnswer: Math.exp(x), _pct: 8 };
}

function checkLog(trial, answer) {
    if (trial._pct) return gradeWithinPercent(parseSci(answer), trial.correctAnswer, trial._pct, fmtSci);
    return gradeWithin(parseFloat(answer), trial.correctAnswer, trial._tol, v => v.toFixed(3));
}

function makeRoot() {
    const kind = choice(['sqrt', 'cbrt', 'square']);
    if (kind === 'sqrt') {
        const n = randInt(2, 999);
        return { question: `√${n} = ?`, inputHTML: numberInput('value', '0.01'), correctAnswer: Math.sqrt(n), _pct: 2 };
    }
    if (kind === 'cbrt') {
        const n = randInt(2, 999);
        return { question: `∛${n} = ?`, inputHTML: numberInput('value', '0.01'), correctAnswer: Math.cbrt(n), _pct: 3 };
    }
    const n = randInt(12, 99);
    return { question: `${n}² = ?`, inputHTML: numberInput('value'), correctAnswer: n * n, _pct: 0.5 };
}

function checkRoot(trial, answer) {
    return gradeWithinPercent(parseFloat(answer), trial.correctAnswer, trial._pct,
        v => Number(v.toPrecision(5)).toString());
}

// -------------------------------------------------------------------- assembly

export class PhysicsFluencySkill extends InterleavedSkill {
    constructor() {
        super('physics-fluency', 'Physics Fluency', [
            { tag: 'powers', name: 'Powers of ten', make: makePowers, check: checkSci },
            { tag: 'physunit', name: 'Unit conversion', make: makePhysUnit, check: checkSci },
            { tag: 'constant', name: 'Constants', make: makeConstant, check: checkConstant },
            { tag: 'dimension', name: 'Dimensional check', make: makeDimension, check: checkDimension },
            { tag: 'log', name: 'Logs and exponentials', make: makeLog, check: checkLog },
            { tag: 'root', name: 'Roots and squares', make: makeRoot, check: checkRoot },
        ]);
    }
}
