// Base Skill Class
//
// Every skill keeps its own lifetime record: how many trials, how many right,
// and - since accuracy on a well-drilled skill tops out fast - how quickly each
// one was answered. `bestMs` is the fastest *correct* answer ever given, which
// is the number worth chasing once you stop getting things wrong.
export class Skill {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.data = {
            totalTrials: 0,
            correctTrials: 0,
            lastPracticed: null,
            bestMs: null,
            history: []
        };
    }

    getData() {
        return this.data;
    }

    loadData(data) {
        this.data = data;
        // Records saved before timing existed have no bestMs field.
        if (this.data.bestMs === undefined) this.data.bestMs = null;
    }

    // A skill can interleave several question types; `tag` says which one this
    // trial was, so per-type stats stay available in the history.
    recordTrial(score, ms = null, tag = null) {
        this.data.totalTrials++;
        if (score === 1) {
            this.data.correctTrials++;
            if (ms != null && (this.data.bestMs == null || ms < this.data.bestMs)) {
                this.data.bestMs = ms;
            }
        }
        this.data.lastPracticed = new Date().toISOString();
        const entry = { timestamp: new Date().toISOString(), score: score };
        if (ms != null) entry.ms = ms;
        if (tag) entry.tag = tag;
        this.data.history.push(entry);
    }

    // Median time over the last `n` correct answers - a steadier read on
    // current speed than an average, which one slow trial can wreck.
    recentMedianMs(n = 20) {
        const times = this.data.history
            .filter(h => h.score === 1 && typeof h.ms === 'number')
            .slice(-n)
            .map(h => h.ms)
            .sort((a, b) => a - b);
        if (!times.length) return null;
        return times[Math.floor(times.length / 2)];
    }

    // To be implemented by subclasses
    generateTrial() {
        throw new Error('generateTrial must be implemented');
    }

    checkAnswer(trial, answer) {
        throw new Error('checkAnswer must be implemented');
    }
}

// Shared helper for the interleaved skills: pick one question type at random,
// but never the same type twice in a row, so a five-minute session actually
// mixes rather than clumping.
export class InterleavedSkill extends Skill {
    constructor(id, name, types) {
        super(id, name);
        this.types = types;
        this.lastType = null;
    }

    pickType() {
        let pool = this.types;
        if (this.types.length > 1 && this.lastType) {
            pool = this.types.filter(t => t.tag !== this.lastType);
        }
        const type = pool[Math.floor(Math.random() * pool.length)];
        this.lastType = type.tag;
        return type;
    }

    generateTrial() {
        const type = this.pickType();
        const trial = type.make();
        trial.tag = type.tag;
        trial.typeName = type.name;
        return trial;
    }

    checkAnswer(trial, answer) {
        const type = this.types.find(t => t.tag === trial.tag);
        return type.check(trial, answer);
    }
}

// Small shared utilities the skills lean on.
export function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function choice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Shuffle a copy, for multiple-choice option order.
export function shuffled(arr) {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}

// Standard numeric input, so every skill's answer box looks and behaves alike.
export function numberInput(placeholder, step = 'any') {
    return `<input type="number" id="answerInput" placeholder="${placeholder}" step="${step}">`;
}

// Multiple choice rendered as a radio list. Skills using this return
// `choices` on the trial and grade against `correctAnswer`.
export function choiceInput(options) {
    return '<div class="choice-list">' + options.map((o, i) =>
        `<label class="choice"><input type="radio" name="answerInput" value="${i}"> <span>${o}</span></label>`
    ).join('') + '</div>';
}

// Graded to a tolerance: full credit inside `tol`, partial credit as it degrades.
// Used by everything that's an estimate rather than an exact answer.
export function gradeWithin(userAnswer, correct, tol, format) {
    const fmt = format || (v => String(v));
    if (!isFinite(userAnswer)) {
        return { score: 0, correct: false, feedback: `Answer: ${fmt(correct)}` };
    }
    const diff = Math.abs(userAnswer - correct);
    let score = 0;
    if (diff <= tol) score = 1;
    else if (diff <= tol * 2) score = 0.6;
    else if (diff <= tol * 4) score = 0.3;
    const isCorrect = diff <= tol;
    const feedback = isCorrect
        ? `${fmt(correct)} (you said ${fmt(userAnswer)}, off by ${fmt(diff)})`
        : `Off by ${fmt(diff)}. Correct answer: ${fmt(correct)} (you said ${fmt(userAnswer)})`;
    return { score, correct: isCorrect, feedback };
}

// Same idea, but the tolerance is a percentage of the true value - the right
// shape for anything spanning orders of magnitude.
export function gradeWithinPercent(userAnswer, correct, pct, format) {
    const tol = Math.abs(correct) * pct / 100;
    return gradeWithin(userAnswer, correct, tol, format);
}
