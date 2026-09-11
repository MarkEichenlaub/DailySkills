import { InterleavedSkill, numberInput, choiceInput, randInt, choice, shuffled, gradeWithin, gradeWithinPercent } from './base.js';

// Arithmetic that comes up away from a desk: converting units, working out what
// something costs, reading a percentage, figuring out what time it is somewhere
// else. All interleaved, because mixing question types is what makes practice
// stick rather than drilling one kind in a block.

// ------------------------------------------------------------- unit conversion

const CONVERSIONS = [
    { from: 'miles', to: 'km', factor: 1.609344, lo: 1, hi: 300 },
    { from: 'km', to: 'miles', factor: 1 / 1.609344, lo: 1, hi: 400 },
    { from: 'pounds', to: 'kg', factor: 0.45359237, lo: 5, hi: 250 },
    { from: 'kg', to: 'pounds', factor: 1 / 0.45359237, lo: 2, hi: 120 },
    { from: 'inches', to: 'cm', factor: 2.54, lo: 1, hi: 80 },
    { from: 'cm', to: 'inches', factor: 1 / 2.54, lo: 2, hi: 200 },
    { from: 'feet', to: 'meters', factor: 0.3048, lo: 3, hi: 300 },
    { from: 'meters', to: 'feet', factor: 1 / 0.3048, lo: 1, hi: 100 },
    { from: 'US gallons', to: 'liters', factor: 3.785411784, lo: 1, hi: 40 },
    { from: 'liters', to: 'US gallons', factor: 1 / 3.785411784, lo: 1, hi: 100 },
    { from: 'mph', to: 'm/s', factor: 0.44704, lo: 5, hi: 90 },
    { from: 'm/s', to: 'mph', factor: 1 / 0.44704, lo: 1, hi: 40 },
    { from: 'ounces', to: 'grams', factor: 28.349523125, lo: 1, hi: 40 },
];

function makeUnit() {
    const c = choice(CONVERSIONS);
    const value = randInt(c.lo, c.hi);
    return {
        question: `${value} ${c.from} = ? ${c.to}`,
        inputHTML: numberInput(c.to),
        correctAnswer: value * c.factor,
        _unit: c.to,
    };
}

function checkUnit(trial, answer) {
    return gradeWithinPercent(parseFloat(answer), trial.correctAnswer, 5,
        v => `${v.toFixed(1)} ${trial._unit}`);
}

// ----------------------------------------------------------------------- tips

function makeTip() {
    const bill = randInt(1800, 14500) / 100;
    const pct = choice([15, 18, 20, 22, 25]);
    const split = Math.random() < 0.4 ? choice([2, 3, 4, 5]) : 1;
    const total = bill * (1 + pct / 100);
    return {
        question: split === 1
            ? `The bill is $${bill.toFixed(2)}. With a ${pct}% tip, what's the total?`
            : `The bill is $${bill.toFixed(2)}. With a ${pct}% tip, split ${split} ways, what does each person pay?`,
        inputHTML: numberInput('$'),
        correctAnswer: total / split,
    };
}

function checkMoney(trial, answer) {
    const tol = Math.max(0.5, trial.correctAnswer * 0.02);
    return gradeWithin(parseFloat(answer), trial.correctAnswer, tol, v => '$' + v.toFixed(2));
}

// ------------------------------------------------------------------ percentages

function makePercentOff() {
    const price = randInt(1200, 24000) / 100;
    const off = choice([10, 15, 20, 25, 30, 35, 40, 60, 70]);
    return {
        question: `$${price.toFixed(2)}, marked down ${off}%. What do you pay?`,
        inputHTML: numberInput('$'),
        correctAnswer: price * (1 - off / 100),
    };
}

function makePercentChange() {
    const a = randInt(20, 900);
    const b = Math.max(1, Math.round(a * (0.3 + Math.random() * 1.8)));
    return {
        question: `Something went from ${a} to ${b}. What percent change is that?`,
        inputHTML: numberInput('%'),
        correctAnswer: (b - a) / a * 100,
    };
}

function checkPercentChange(trial, answer) {
    return gradeWithin(parseFloat(answer), trial.correctAnswer, 3,
        v => v.toFixed(1) + '%');
}

// ------------------------------------------------------------------ unit price

const GROCERIES = [
    { name: 'olive oil', unit: 'oz', lo: 8, hi: 50 },
    { name: 'coffee', unit: 'oz', lo: 10, hi: 40 },
    { name: 'laundry detergent', unit: 'loads', lo: 20, hi: 110 },
    { name: 'rice', unit: 'lb', lo: 2, hi: 20 },
    { name: 'paper towels', unit: 'rolls', lo: 2, hi: 12 },
    { name: 'peanut butter', unit: 'oz', lo: 12, hi: 40 },
];

function makeUnitPrice() {
    const g = choice(GROCERIES);
    const qA = randInt(g.lo, g.hi);
    const qB = Math.max(g.lo, Math.round(qA * (1.3 + Math.random())));
    const perA = (randInt(15, 90)) / 100;
    // Keep the two unit prices far enough apart to be decidable, but close
    // enough that the bigger package isn't automatically the answer.
    const perB = perA * (Math.random() < 0.5 ? 0.72 + Math.random() * 0.16 : 1.12 + Math.random() * 0.16);
    const costA = qA * perA, costB = qB * perB;
    const options = [
        `${qA} ${g.unit} for $${costA.toFixed(2)}`,
        `${qB} ${g.unit} for $${costB.toFixed(2)}`,
    ];
    const correctIndex = perA < perB ? 0 : 1;
    return {
        question: `Which ${g.name} is the better deal per ${g.unit.replace(/s$/, '')}?`,
        inputHTML: choiceInput(options),
        correctAnswer: correctIndex,
        _options: options,
        _per: [perA, perB],
        _unit: g.unit,
    };
}

function checkUnitPrice(trial, answer) {
    const picked = parseInt(answer, 10);
    const isCorrect = picked === trial.correctAnswer;
    const detail = `$${trial._per[0].toFixed(3)} vs $${trial._per[1].toFixed(3)} per ${trial._unit.replace(/s$/, '')}`;
    return {
        score: isCorrect ? 1 : 0, correct: isCorrect,
        feedback: isCorrect ? detail : `Cheaper: ${trial._options[trial.correctAnswer]} — ${detail}`,
    };
}

// ------------------------------------------------------------------- time zones

// Standard-time offsets from UTC. DST is deliberately left out: the aim is
// knowing roughly how far around the world somewhere is, not date arithmetic.
const ZONES = [
    { city: 'Los Angeles', off: -8 },
    { city: 'Denver', off: -7 },
    { city: 'Chicago', off: -6 },
    { city: 'New York', off: -5 },
    { city: 'São Paulo', off: -3 },
    { city: 'London', off: 0 },
    { city: 'Berlin', off: 1 },
    { city: 'Lagos', off: 1 },
    { city: 'Jerusalem', off: 2 },
    { city: 'Nairobi', off: 3 },
    { city: 'Moscow', off: 3 },
    { city: 'Dubai', off: 4 },
    { city: 'Delhi', off: 5.5 },
    { city: 'Bangkok', off: 7 },
    { city: 'Shanghai', off: 8 },
    { city: 'Singapore', off: 8 },
    { city: 'Tokyo', off: 9 },
    { city: 'Sydney', off: 10 },
    { city: 'Auckland', off: 12 },
    { city: 'Honolulu', off: -10 },
];

function fmtClock(hoursFloat) {
    let h = ((hoursFloat % 24) + 24) % 24;
    const hh = Math.floor(h);
    const mm = Math.round((h - hh) * 60);
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function makeTimeZone() {
    const a = choice(ZONES);
    let b = choice(ZONES);
    while (b.city === a.city || b.off === a.off) b = choice(ZONES);
    const hour = randInt(0, 23);
    const minute = choice([0, 0, 15, 30, 45]);
    const local = hour + minute / 60;
    const there = local - a.off + b.off;
    return {
        question: `It's ${fmtClock(local)} standard time in ${a.city}. What time is it in ${b.city}? (24-hour clock)`,
        inputHTML: '<input type="text" id="answerInput" placeholder="e.g. 14:30" autocomplete="off">',
        correctAnswer: ((there % 24) + 24) % 24,
    };
}

function checkTimeZone(trial, answer) {
    const m = String(answer).trim().match(/^(\d{1,2})[:.]?(\d{2})?$/);
    const correctStr = fmtClock(trial.correctAnswer);
    if (!m) return { score: 0, correct: false, feedback: `Answer: ${correctStr}` };
    const given = parseInt(m[1], 10) + (m[2] ? parseInt(m[2], 10) / 60 : 0);
    // The clock wraps, so 23:30 and 00:30 are an hour apart.
    let diff = Math.abs(given - trial.correctAnswer);
    if (diff > 12) diff = 24 - diff;
    const isCorrect = diff < 0.01;
    return {
        score: isCorrect ? 1 : diff <= 1 ? 0.5 : 0,
        correct: isCorrect,
        feedback: isCorrect ? correctStr : `Answer: ${correctStr} (you said ${String(answer).trim()})`,
    };
}

// ------------------------------------------------------------------ rule of 72

function makeDoubling() {
    const rate = choice([2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15]);
    return {
        question: `Growing at ${rate}% a year, about how many years to double?`,
        inputHTML: numberInput('years'),
        correctAnswer: Math.log(2) / Math.log(1 + rate / 100),
    };
}

function checkDoubling(trial, answer) {
    return gradeWithinPercent(parseFloat(answer), trial.correctAnswer, 10,
        v => v.toFixed(1) + ' years');
}

// ----------------------------------------------------------------------- odds

function makeOdds() {
    if (Math.random() < 0.5) {
        const a = randInt(1, 9), b = choice([1, 1, 1, 2, 3, 4]);
        const p = b / (a + b) * 100;
        return {
            question: `Odds of ${a}:${b} against. What's the probability, as a percent?`,
            inputHTML: numberInput('%'),
            correctAnswer: p,
            _mode: 'toPct',
        };
    }
    const p = choice([5, 10, 20, 25, 33, 40, 50, 60, 75, 80, 90]);
    return {
        question: `Something has a ${p}% chance. The odds against it are X:1 — what is X?`,
        inputHTML: numberInput('X', '0.1'),
        correctAnswer: (100 - p) / p,
        _mode: 'toOdds',
    };
}

function checkOdds(trial, answer) {
    if (trial._mode === 'toPct') {
        return gradeWithin(parseFloat(answer), trial.correctAnswer, 2, v => v.toFixed(1) + '%');
    }
    return gradeWithinPercent(parseFloat(answer), trial.correctAnswer, 8, v => v.toFixed(2));
}

// -------------------------------------------------------------------- assembly

export class DailyArithmeticSkill extends InterleavedSkill {
    constructor() {
        super('daily-arithmetic', 'Daily Arithmetic', [
            { tag: 'unit', name: 'Unit conversion', make: makeUnit, check: checkUnit },
            { tag: 'tip', name: 'Tip and split', make: makeTip, check: checkMoney },
            { tag: 'pctoff', name: 'Percent off', make: makePercentOff, check: checkMoney },
            { tag: 'pctchange', name: 'Percent change', make: makePercentChange, check: checkPercentChange },
            { tag: 'unitprice', name: 'Better deal', make: makeUnitPrice, check: checkUnitPrice },
            { tag: 'tz', name: 'Time zones', make: makeTimeZone, check: checkTimeZone },
            { tag: 'doubling', name: 'Doubling time', make: makeDoubling, check: checkDoubling },
            { tag: 'odds', name: 'Odds', make: makeOdds, check: checkOdds },
        ]);
    }
}
