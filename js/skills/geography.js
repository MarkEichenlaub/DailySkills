import { InterleavedSkill, choiceInput, choice, shuffled } from './base.js';
import { COUNTRIES, WATERWAYS } from '../data/geography.js';

// Geography aimed at reading the news: where a country is, who it touches, how
// big it is next to somewhere you already know, and which strait is the one the
// story keeps mentioning.

const WITH_CAPITAL = COUNTRIES.filter(c => c.capital && !c.noCapital);

// Build a four-option question from one right answer and a pool of wrong ones.
function mcq(question, right, wrongPool, extra = {}) {
    const wrongs = shuffled(wrongPool).slice(0, 3);
    const options = shuffled([right, ...wrongs]);
    return {
        question,
        inputHTML: choiceInput(options),
        correctAnswer: options.indexOf(right),
        _options: options,
        ...extra,
    };
}

function checkMcq(trial, answer) {
    const picked = parseInt(answer, 10);
    const isCorrect = picked === trial.correctAnswer;
    const right = trial._options[trial.correctAnswer];
    return {
        score: isCorrect ? 1 : 0,
        correct: isCorrect,
        feedback: isCorrect ? right : `Answer: ${right}` + (trial._note ? ` — ${trial._note}` : ''),
    };
}

// ------------------------------------------------------------------- capitals

function makeCapital() {
    const c = choice(WITH_CAPITAL);
    const others = WITH_CAPITAL.filter(o => o.name !== c.name).map(o => o.capital);
    return mcq(`What is the capital of ${c.name}?`, c.capital, others);
}

function makeCapitalReverse() {
    const c = choice(WITH_CAPITAL);
    const others = WITH_CAPITAL.filter(o => o.name !== c.name).map(o => o.name);
    return mcq(`${c.capital} is the capital of which country?`, c.name, others);
}

// -------------------------------------------------------------------- borders

// Only countries whose neighbor list includes something else in the data set
// can be asked, or there'd be no right answer to offer.
const BORDER_SUBJECTS = COUNTRIES.filter(c =>
    c.borders.some(b => COUNTRIES.some(o => o.name === b)));

function makeBorder() {
    const c = choice(BORDER_SUBJECTS);
    const neighbors = c.borders.filter(b => COUNTRIES.some(o => o.name === b));
    const right = choice(neighbors);
    // A distractor must not be a neighbor, and must not be the country itself.
    const wrongPool = COUNTRIES
        .filter(o => o.name !== c.name && !c.borders.includes(o.name))
        .map(o => o.name);
    return mcq(`Which of these shares a land border with ${c.name}?`, right, wrongPool, {
        _note: `${c.name} borders ${c.borders.slice(0, 6).join(', ')}${c.borders.length > 6 ? ', and others' : ''}`,
    });
}

// ------------------------------------------------------------ bigger or smaller

function makeBigger() {
    const byPop = Math.random() < 0.5;
    const key = byPop ? 'pop' : 'area';
    let a = choice(COUNTRIES), b = choice(COUNTRIES);
    // Too close a call stops being a knowledge question and becomes a coin flip.
    let tries = 0;
    while ((a.name === b.name || Math.max(a[key], b[key]) / Math.min(a[key], b[key]) < 1.3) && tries < 60) {
        b = choice(COUNTRIES);
        tries++;
    }
    const bigger = a[key] > b[key] ? a : b;
    const options = shuffled([a.name, b.name]);
    const label = byPop ? 'more people' : 'more land area';
    const val = x => byPop ? `${x.pop} million` : `${x.area.toLocaleString()} thousand km²`;
    return {
        question: `Which has ${label}: ${options[0]} or ${options[1]}?`,
        inputHTML: choiceInput(options),
        correctAnswer: options.indexOf(bigger.name),
        _options: options,
        _note: `${a.name} ${val(a)}, ${b.name} ${val(b)}`,
    };
}

// --------------------------------------------------------------------- region

function makeRegion() {
    const c = choice(COUNTRIES);
    const regions = [...new Set(COUNTRIES.map(o => o.region))];
    const wrongPool = regions.filter(r => r !== c.region);
    return mcq(`Which region is ${c.name} in?`, c.region, wrongPool);
}

// ------------------------------------------------------------------ waterways

function makeWaterwayConnects() {
    const w = choice(WATERWAYS.filter(x => !x.noConnects));
    const others = WATERWAYS.filter(x => x.name !== w.name).map(x => x.name);
    return mcq(`Which waterway connects ${w.connects[0]} and ${w.connects[1]}?`, w.name, others);
}

function makeWaterwayBetween() {
    const w = choice(WATERWAYS);
    if (w.single) {
        const others = COUNTRIES.filter(c => c.name !== w.single).map(c => c.name);
        return mcq(`${w.name} is in which country?`, w.single, others);
    }
    const pair = `${w.between[0]} and ${w.between[1]}`;
    const wrongPool = WATERWAYS
        .filter(x => x.name !== w.name && !x.single)
        .map(x => `${x.between[0]} and ${x.between[1]}`);
    return mcq(`${w.name} lies between which two?`, pair, wrongPool);
}

// -------------------------------------------------------------------- assembly

export class GeographySkill extends InterleavedSkill {
    constructor() {
        super('geography', 'Geography for the News', [
            { tag: 'capital', name: 'Capital', make: makeCapital, check: checkMcq },
            { tag: 'capitalrev', name: 'Capital, reversed', make: makeCapitalReverse, check: checkMcq },
            { tag: 'border', name: 'Neighbors', make: makeBorder, check: checkMcq },
            { tag: 'bigger', name: 'Bigger or smaller', make: makeBigger, check: checkMcq },
            { tag: 'region', name: 'Region', make: makeRegion, check: checkMcq },
            { tag: 'waterconnect', name: 'Waterways', make: makeWaterwayConnects, check: checkMcq },
            { tag: 'waterwhere', name: 'Waterways', make: makeWaterwayBetween, check: checkMcq },
        ]);
    }
}
