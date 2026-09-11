import { InterleavedSkill, numberInput, choice, randInt } from './base.js';

// Sine, cosine and tangent of an angle in degrees, to about two decimal places.
// The point is a usable number in your head, not a calculator result, so the
// margin is deliberately loose.

// A mix of the angles with exact values and arbitrary ones, so it doesn't turn
// into recall of a table.
function pickDegrees(fn) {
    const standard = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330];
    let deg;
    if (Math.random() < 0.45) {
        deg = choice(standard);
    } else {
        deg = randInt(1, 359);
    }
    if (fn === 'tan') {
        // Near the asymptotes the answer stops being estimable.
        const near90 = Math.min(Math.abs(((deg % 180) - 90)), 180 - Math.abs((deg % 180) - 90));
        if (near90 < 12) return pickDegrees(fn);
    }
    return deg;
}

function make(fn) {
    return () => {
        const deg = pickDegrees(fn);
        const rad = deg * Math.PI / 180;
        const value = fn === 'sin' ? Math.sin(rad) : fn === 'cos' ? Math.cos(rad) : Math.tan(rad);
        return {
            question: `${fn}(${deg}°) = ?`,
            inputHTML: numberInput('value', '0.01'),
            correctAnswer: value,
            _fn: fn,
            _deg: deg,
        };
    };
}

function check(trial, answer) {
    const user = parseFloat(answer);
    const correct = trial.correctAnswer;
    const shown = Math.abs(correct) < 10 ? correct.toFixed(3) : correct.toFixed(2);
    if (!isFinite(user)) {
        return { score: 0, correct: false, feedback: `${trial._fn}(${trial._deg}°) = ${shown}` };
    }
    // Sine and cosine live in [-1, 1], so a flat margin is right. Tangent runs
    // away, so it gets a relative margin once the value is large.
    const tol = trial._fn === 'tan'
        ? Math.max(0.05, Math.abs(correct) * 0.1)
        : 0.05;
    const diff = Math.abs(user - correct);
    const isCorrect = diff <= tol;
    const score = diff <= tol ? 1 : diff <= tol * 2 ? 0.6 : diff <= tol * 4 ? 0.3 : 0;
    return {
        score, correct: isCorrect,
        feedback: isCorrect
            ? `${trial._fn}(${trial._deg}°) = ${shown} (you said ${user})`
            : `${trial._fn}(${trial._deg}°) = ${shown}, you said ${user}`,
    };
}

export class TrigSkill extends InterleavedSkill {
    constructor() {
        super('trig-values', 'Sine, Cosine, Tangent', [
            { tag: 'sin', name: 'sine', make: make('sin'), check },
            { tag: 'cos', name: 'cosine', make: make('cos'), check },
            { tag: 'tan', name: 'tangent', make: make('tan'), check },
        ]);
    }
}
