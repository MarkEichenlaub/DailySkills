import { Skill, choice, randInt } from './base.js';
import { knRenderPreview, knFlashWrong, knEscHtml } from './keyboard.js';
import { OPS, OP_BY_ID, reachableTexts, segments, lineBounds } from './textops.js';

// Edit to Target — the one that builds speed.
//
// The other keyboard skills tell you which chord to press. This one shows you
// what the text has to end up as and leaves the route to you, then scores the
// number of keystrokes against the fewest that could possibly have worked.
// Choosing the shortcut yourself is the part that transfers to real editing.
//
// The optimum isn't guessed: textops.js searches the space of Mark's own chords
// breadth-first, so the target's cost is exactly the length of the shortest
// path to it.

const SAMPLES = [
    'the quick brown fox jumps over the lazy dog',
    'close the loop before you ship the fix',
    'always double check the units before submitting',
    'measure twice and cut once before you commit',
    'never trust a shortcut you have not tested yet',
    'small steady habits beat big rare bursts of effort',
    'first line of text\nsecond line here\nthird line now\nfourth one too',
    'alpha bravo\ncharlie delta\necho foxtrot\ngolf hotel',
    'monday morning start\ntuesday keeps going\nwednesday halfway there',
    'north star bright\nsouth wind cold\neast light early\nwest sky red',
];

function wordSpans(text) {
    return segments(text).filter(s => s.isWordLike);
}

// Candidate targets that read as a deliberate edit - a word, a couple of words,
// the rest of a line, a whole line - rather than an arbitrary cut mid-word.
// Every one is a single contiguous deletion, which is what lets the prompt show
// the removal struck through on the original instead of two blocks of text.
function candidateTargets(text) {
    const out = [];
    const push = (from, to, label) => {
        out.push({ text: text.slice(0, from) + text.slice(to), from, to, label });
    };
    const words = wordSpans(text);

    words.forEach((w, i) => {
        const lb = lineBounds(text, w.start);
        const next = words[i + 1];
        const nextOnLine = next && next.start <= lb.end ? next : null;

        push(w.start, nextOnLine ? nextOnLine.start : w.end, 'a word');

        if (nextOnLine) {
            const after = words[i + 2];
            const afterOnLine = after && after.start <= lb.end ? after : null;
            push(w.start, afterOnLine ? afterOnLine.start : nextOnLine.end, 'two words');
        }
        if (lb.end > w.start) push(w.start, lb.end, 'to the end of the line');
    });

    const lines = text.split('\n');
    let acc = 0;
    lines.forEach((ln, j) => {
        const start = acc, end = acc + ln.length;
        const last = j === lines.length - 1;
        push(last ? Math.max(0, start - 1) : start, last ? end : end + 1, 'a whole line');
        acc = end + 1;
    });

    return out;
}

export class EditToTargetSkill extends Skill {
    constructor() {
        super('edit-target', 'Edit to Target');
        this.lastSample = null;
    }

    generateTrial(attempt = 0) {
        let text = choice(SAMPLES);
        if (SAMPLES.length > 1 && text === this.lastSample) text = choice(SAMPLES.filter(t => t !== this.lastSample));
        this.lastSample = text;

        // Start the caret at the beginning of some word, so the route is never
        // the same one twice running.
        const words = wordSpans(text);
        const startPos = choice(words).start;

        const reach = reachableTexts({ text, pos: startPos, anchor: null }, 4);
        const usable = candidateTargets(text)
            .map(c => ({ ...c, found: reach.get(c.text) }))
            .filter(c => c.found && c.found.cost >= 2 && c.found.cost <= 4 && c.text !== text);

        // A caret can land somewhere that nothing interesting is reachable from
        // in four keystrokes. Rather than offer a bad trial, draw again.
        if (!usable.length) {
            if (attempt < 6) return this.generateTrial(attempt + 1);
            return this.generateTrial0Fallback(text, startPos);
        }

        const target = choice(usable);
        const rows = Math.max(2, text.split('\n').length);
        const preview = knRenderPreview(text, startPos, { type: 'delete', from: target.from, to: target.to });

        return {
            question: `Make the edit. Fewest keystrokes wins.`,
            inputHTML: `
                <div class="kb-badge">${knEscHtml(target.label)} — ${target.found.cost} keystrokes</div>
                <div class="kb-preview">${preview}</div>
                <textarea class="kb-textarea" id="etArea" wrap="off" spellcheck="false" rows="${rows}"></textarea>
                <div class="et-counter"><span id="etCounter">0 keystrokes</span> <span class="et-hint">Esc to give up</span></div>
            `,
            correctAnswer: null,
            _startText: text,
            _startPos: startPos,
            _target: target,
            _optimal: target.found.cost,
            _path: target.found.path,
            tag: target.label,
            typeName: target.label,
        };
    }

    // Only reached if six different caret positions all came up empty, which
    // needs a sample this shouldn't contain. Delete one word from the front.
    generateTrial0Fallback(text) {
        const w = wordSpans(text)[0];
        return {
            question: 'Make the edit. Fewest keystrokes wins.',
            inputHTML: `
                <div class="kb-badge">a word</div>
                <div class="kb-preview">${knRenderPreview(text, 0, { type: 'delete', from: w.start, to: w.end })}</div>
                <textarea class="kb-textarea" id="etArea" wrap="off" spellcheck="false" rows="2"></textarea>
                <div class="et-counter"><span id="etCounter">0 keystrokes</span> <span class="et-hint">Esc to give up</span></div>
            `,
            correctAnswer: null,
            _startText: text,
            _startPos: 0,
            _target: { text: text.slice(0, w.start) + text.slice(w.end), label: 'a word' },
            _optimal: 1,
            _path: ['delWord'],
            tag: 'a word',
            typeName: 'a word',
        };
    }

    onTrialRendered(trial, inputArea, app) {
        const MODIFIERS = new Set(['Control', 'Alt', 'Shift', 'Meta', 'AltGraph', 'OS']);
        const textarea = inputArea.querySelector('#etArea');
        const counter = inputArea.querySelector('#etCounter');
        textarea.value = trial._startText;
        textarea.setSelectionRange(trial._startPos, trial._startPos);
        textarea.focus();

        let keystrokes = 0;
        let graded = false;

        const chordList = () => trial._path.map(id => OP_BY_ID[id].keys).join(' → ');

        const grade = (reached) => {
            if (graded) return;
            graded = true;
            document.removeEventListener('keydown', escListener);
            textarea.readOnly = true;
            const k = keystrokes;
            const m = trial._optimal;
            let score, feedback;
            if (!reached) {
                score = 0;
                feedback = `Gave up after ${k}. The ${m}-keystroke route: ${chordList()}`;
            } else if (k <= m) {
                score = 1;
                feedback = `${k} keystroke${k === 1 ? '' : 's'} — that's the best possible.`;
            } else if (k <= m + 2) {
                score = 0.6;
                feedback = `${k} keystrokes, best is ${m}: ${chordList()}`;
            } else if (k <= m * 2 + 2) {
                score = 0.3;
                feedback = `${k} keystrokes, best is ${m}: ${chordList()}`;
            } else {
                score = 0;
                feedback = `${k} keystrokes, best is ${m}: ${chordList()}`;
            }
            trial._liveResult = { correct: reached && k <= m, score, feedback };
            app.submitAnswer();
        };

        const escListener = (e) => {
            // If the session ended on this trial, the listener can outlive it.
            // Only act while this is still the trial on screen.
            if (app.currentTrial !== trial) {
                document.removeEventListener('keydown', escListener);
                return;
            }
            if (!graded && e.key === 'Escape') {
                e.preventDefault();
                grade(false);
            }
        };
        document.addEventListener('keydown', escListener);

        textarea.addEventListener('keydown', (e) => {
            if (graded) return;
            if (e.key === 'Escape') return;
            // Enter would insert a newline and quietly make the target
            // unreachable, so it gives up instead - same as Escape.
            if (e.key === 'Enter') {
                e.preventDefault();
                grade(false);
                return;
            }
            // A chord arrives as several keydown events; only the final
            // non-modifier one is a keystroke the user actually spent.
            if (MODIFIERS.has(e.key)) return;
            keystrokes++;
            counter.textContent = `${keystrokes} keystroke${keystrokes === 1 ? '' : 's'}`;
        });

        textarea.addEventListener('keyup', (e) => {
            if (graded || MODIFIERS.has(e.key)) return;
            if (textarea.value === trial._target.text) {
                grade(true);
            } else if (textarea.value.length < trial._target.text.length) {
                // Past the target with no way back - a deletion too many.
                knFlashWrong(textarea);
            }
        });
    }

    checkAnswer(trial) {
        const r = trial._liveResult
            || { correct: false, score: 0, feedback: 'No edit made — try again next round.' };
        return { score: r.score, correct: r.correct, feedback: r.feedback };
    }
}
