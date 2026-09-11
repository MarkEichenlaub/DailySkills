import { Skill } from './base.js';

// ============================================================
// Keyboard Shortcuts Skill — text-navigation muscle memory
// ============================================================
// Trains Mark's actual global AutoHotkey text-navigation/editing
// remaps (default.ahk) plus EigenNode's own node-level overrides,
// rather than generic OS shortcuts.
//
// Two ways a trial is graded:
//  - "native": the real chord (e.g. Ctrl+H) is intercepted by AHK
//    and turned into a plain browser key (e.g. Left), which the
//    textarea handles natively. We just compare the resulting
//    selection/value to the expected outcome.
//  - "manual": EigenNode-only chords (Alt+G, etc.) that AHK does
//    NOT remap outside EigenNode, so the browser sees the raw
//    chord. We match it ourselves and apply the transform, since
//    there's no real "node" here to do it natively.
// A few EigenNode chords (like Ctrl+Alt+;) collide with an AHK
// global remap and can't be safely practiced live in a browser —
// those are quick multiple-choice recall trials instead.

function knFlashWrong(el) {
    el.classList.remove('kb-flash-wrong');
    void el.offsetWidth; // restart the animation if it's already mid-flash
    el.classList.add('kb-flash-wrong');
}

function knEscHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function knSegments(text) {
    const seg = new Intl.Segmenter(undefined, { granularity: 'word' });
    const out = [];
    let idx = 0;
    for (const s of seg.segment(text)) {
        out.push({ start: idx, end: idx + s.segment.length, isWordLike: s.isWordLike });
        idx += s.segment.length;
    }
    return out;
}

function knWordForward(text, pos) {
    for (const s of knSegments(text)) {
        if (s.isWordLike && s.start > pos) return s.start;
    }
    return text.length;
}

function knWordBack(text, pos) {
    const words = knSegments(text).filter(s => s.isWordLike && s.start < pos);
    return words.length ? words[words.length - 1].start : 0;
}

function knLineBounds(text, pos) {
    const start = text.lastIndexOf('\n', pos - 1) + 1;
    let end = text.indexOf('\n', pos);
    if (end === -1) end = text.length;
    return { start, end };
}

function knMoveLines(text, pos, delta) {
    const lines = text.split('\n');
    let idx = 0, acc = 0;
    for (; idx < lines.length; idx++) {
        if (acc + lines[idx].length >= pos) break;
        acc += lines[idx].length + 1;
    }
    const col = pos - acc;
    const targetIdx = Math.max(0, Math.min(lines.length - 1, idx + delta));
    let targetStart = 0;
    for (let i = 0; i < targetIdx; i++) targetStart += lines[i].length + 1;
    return targetStart + Math.min(col, lines[targetIdx].length);
}

// highlight: {type:'move', to} | {type:'select', from, to} | {type:'delete', from, to}
function knRenderPreview(text, pos, highlight) {
    if (!highlight || highlight.type === 'move') {
        const to = highlight ? highlight.to : pos;
        const points = [...new Set([pos, to])].sort((a, b) => a - b);
        let html = '';
        let last = 0;
        for (const p of points) {
            html += knEscHtml(text.slice(last, p));
            if (p === pos) html += '<span class="kb-caret" title="cursor">┃</span>';
            if (p === to && to !== pos) html += '<span class="kb-target" title="target">┆</span>';
            last = p;
        }
        html += knEscHtml(text.slice(last));
        return html;
    }
    const from = Math.min(highlight.from, highlight.to);
    const to = Math.max(highlight.from, highlight.to);
    const cls = highlight.type === 'delete' ? 'kb-del' : 'kb-sel';
    let html = knEscHtml(text.slice(0, from));
    if (pos <= from) html += '<span class="kb-caret" title="cursor">┃</span>';
    html += `<span class="${cls}">${knEscHtml(text.slice(from, to)) || '&nbsp;'}</span>`;
    if (pos >= to) html += '<span class="kb-caret" title="cursor">┃</span>';
    html += knEscHtml(text.slice(to));
    return html;
}

// Single-line samples (varied vocabulary so the same snippet doesn't
// keep reappearing) and multi-line samples for line/node-scoped moves.
const KN_S1 = 'the quick brown fox jumps over the lazy dog';
const KN_S2 = 'close the loop before you ship the fix';
const KN_S3 = 'always double check the units before submitting';
const KN_S4 = 'measure twice and cut once before you commit';
const KN_S5 = 'never trust a shortcut you have not tested yet';
const KN_S6 = 'small steady habits beat big rare bursts of effort';
const KN_M1 = 'first line of text\nsecond line here\nthird line now\nfourth one too\nfifth line goes\nsixth and last';
const KN_M2 = 'alpha bravo\ncharlie delta\necho foxtrot\ngolf hotel';
const KN_M3 = 'monday morning start\ntuesday keeps going\nwednesday halfway there\nthursday almost done\nfriday final push\nsaturday well earned rest';
const KN_M4 = 'north star bright\nsouth wind cold\neast light early\nwest sky red';

const KB_MOVES = [
    {
        id: 'charLeft', context: 'global', driver: 'native', highlightType: 'move',
        keysDisplay: 'Ctrl+H', instruction: 'Move the cursor one character to the left.',
        samples: [
            { text: KN_S1, pos: KN_S1.indexOf('jumps') },
            { text: KN_S2, pos: KN_S2.indexOf('ship') },
            { text: KN_S3, pos: KN_S3.indexOf('units') },
        ],
        compute(text, pos) { const t = pos - 1; return { start: t, end: t, value: text }; },
    },
    {
        id: 'charRight', context: 'global', driver: 'native', highlightType: 'move',
        keysDisplay: 'Ctrl+L', instruction: 'Move the cursor one character to the right.',
        samples: [
            { text: KN_S1, pos: KN_S1.indexOf('jumps') },
            { text: KN_S4, pos: KN_S4.indexOf('cut') },
            { text: KN_S5, pos: KN_S5.indexOf('trust') },
        ],
        compute(text, pos) { const t = pos + 1; return { start: t, end: t, value: text }; },
    },
    {
        id: 'wordLeft', context: 'global', driver: 'native', highlightType: 'move',
        keysDisplay: 'Ctrl+Shift+H', instruction: 'Move the cursor back one word.',
        samples: [
            { text: KN_S1, pos: KN_S1.indexOf('jumps') + 3 },
            { text: KN_S3, pos: KN_S3.indexOf('double') + 3 },
            { text: KN_S6, pos: KN_S6.indexOf('steady') + 3 },
        ],
        compute(text, pos) { const t = knWordBack(text, pos); return { start: t, end: t, value: text }; },
    },
    {
        id: 'wordRight', context: 'global', driver: 'native', highlightType: 'move',
        keysDisplay: 'Ctrl+Shift+L', instruction: 'Move the cursor forward one word.',
        samples: [
            { text: KN_S1, pos: KN_S1.indexOf('jumps') },
            { text: KN_S4, pos: KN_S4.indexOf('measure') },
            { text: KN_S6, pos: KN_S6.indexOf('small') },
        ],
        compute(text, pos) { const t = knWordForward(text, pos); return { start: t, end: t, value: text }; },
    },
    {
        id: 'home', context: 'global', driver: 'native', highlightType: 'move',
        keysDisplay: 'Alt+H', instruction: 'Move the cursor to the beginning of the line.',
        samples: [
            { text: KN_S1, pos: KN_S1.indexOf('jumps') },
            { text: KN_S2, pos: KN_S2.indexOf('ship') },
            { text: KN_S5, pos: KN_S5.indexOf('tested') },
        ],
        compute(text, pos) { const t = knLineBounds(text, pos).start; return { start: t, end: t, value: text }; },
    },
    {
        id: 'end', context: 'global', driver: 'native', highlightType: 'move',
        keysDisplay: 'Alt+L', instruction: 'Move the cursor to the end of the line.',
        samples: [
            { text: KN_S1, pos: KN_S1.indexOf('jumps') },
            { text: KN_S3, pos: KN_S3.indexOf('units') },
            { text: KN_S4, pos: KN_S4.indexOf('cut') },
        ],
        compute(text, pos) { const t = knLineBounds(text, pos).end; return { start: t, end: t, value: text }; },
    },
    {
        id: 'selHome', context: 'global', driver: 'native', highlightType: 'select',
        keysDisplay: 'Shift+Win+H', instruction: 'Highlight from the cursor to the beginning of the line.',
        samples: [
            { text: KN_S1, pos: KN_S1.indexOf('jumps') },
            { text: KN_S5, pos: KN_S5.indexOf('trust') },
            { text: KN_S6, pos: KN_S6.indexOf('beat') },
        ],
        compute(text, pos) { const t = knLineBounds(text, pos).start; return { start: Math.min(pos, t), end: Math.max(pos, t), value: text }; },
    },
    {
        id: 'selEnd', context: 'global', driver: 'native', highlightType: 'select',
        keysDisplay: 'Shift+Win+L', instruction: 'Highlight from the cursor to the end of the line.',
        samples: [
            { text: KN_S1, pos: KN_S1.indexOf('jumps') },
            { text: KN_S2, pos: KN_S2.indexOf('ship') },
            { text: KN_S3, pos: KN_S3.indexOf('double') },
        ],
        compute(text, pos) { const t = knLineBounds(text, pos).end; return { start: Math.min(pos, t), end: Math.max(pos, t), value: text }; },
    },
    {
        id: 'lineDown', context: 'global', driver: 'native', highlightType: 'move',
        keysDisplay: 'Ctrl+J', instruction: 'Move the cursor down one line, keeping the same column.',
        samples: [
            { text: KN_M2, pos: KN_M2.indexOf('bravo') + 1 },
            { text: KN_M4, pos: KN_M4.indexOf('north') + 2 },
        ],
        compute(text, pos) { const t = knMoveLines(text, pos, 1); return { start: t, end: t, value: text }; },
    },
    {
        id: 'lineUp', context: 'global', driver: 'native', highlightType: 'move',
        keysDisplay: 'Ctrl+K', instruction: 'Move the cursor up one line, keeping the same column.',
        samples: [
            { text: KN_M2, pos: KN_M2.indexOf('foxtrot') + 2 },
            { text: KN_M4, pos: KN_M4.indexOf('east') + 1 },
        ],
        compute(text, pos) { const t = knMoveLines(text, pos, -1); return { start: t, end: t, value: text }; },
    },
    {
        id: 'selLineDown', context: 'global', driver: 'native', highlightType: 'select',
        keysDisplay: 'Ctrl+Shift+J', instruction: 'Highlight from the cursor down one line.',
        samples: [
            { text: KN_M2, pos: KN_M2.indexOf('bravo') },
            { text: KN_M4, pos: KN_M4.indexOf('north') },
        ],
        compute(text, pos) { const t = knMoveLines(text, pos, 1); return { start: Math.min(pos, t), end: Math.max(pos, t), value: text }; },
    },
    {
        id: 'selLineUp', context: 'global', driver: 'native', highlightType: 'select',
        keysDisplay: 'Ctrl+Shift+K', instruction: 'Highlight from the cursor up one line.',
        samples: [
            { text: KN_M2, pos: KN_M2.indexOf('foxtrot') },
            { text: KN_M4, pos: KN_M4.indexOf('east') },
        ],
        compute(text, pos) { const t = knMoveLines(text, pos, -1); return { start: Math.min(pos, t), end: Math.max(pos, t), value: text }; },
    },
    {
        id: 'down5', context: 'global', driver: 'native', highlightType: 'move',
        keysDisplay: 'Ctrl+Win+J', instruction: 'Move the cursor down 5 lines.',
        samples: [
            { text: KN_M1, pos: KN_M1.indexOf('first') + 2 },
            { text: KN_M3, pos: KN_M3.indexOf('monday') + 2 },
        ],
        compute(text, pos) { const t = knMoveLines(text, pos, 5); return { start: t, end: t, value: text }; },
    },
    {
        id: 'up5', context: 'global', driver: 'native', highlightType: 'move',
        keysDisplay: 'Ctrl+Win+K', instruction: 'Move the cursor up 5 lines.',
        samples: [
            { text: KN_M1, pos: KN_M1.indexOf('last') },
            { text: KN_M3, pos: KN_M3.indexOf('rest') },
        ],
        compute(text, pos) { const t = knMoveLines(text, pos, -5); return { start: t, end: t, value: text }; },
    },
    {
        id: 'delChar', context: 'global', driver: 'native', highlightType: 'delete',
        keysDisplay: 'Ctrl+;', instruction: 'Delete the character right after the cursor.',
        samples: [
            { text: KN_S1, pos: KN_S1.indexOf('jumps') },
            { text: KN_S4, pos: KN_S4.indexOf('cut') },
            { text: KN_S6, pos: KN_S6.indexOf('beat') },
        ],
        compute(text, pos) {
            return { start: pos, end: pos, value: text.slice(0, pos) + text.slice(pos + 1), delFrom: pos, delTo: pos + 1 };
        },
    },
    {
        id: 'delWord', context: 'global', driver: 'native', highlightType: 'delete',
        keysDisplay: 'Ctrl+Shift+;', instruction: 'Delete from the cursor to the start of the next word.',
        samples: [
            { text: KN_S2, pos: KN_S2.indexOf('before') },
            { text: KN_S5, pos: KN_S5.indexOf('have') },
            { text: KN_S3, pos: KN_S3.indexOf('check') },
        ],
        compute(text, pos) {
            const t = knWordForward(text, pos);
            return { start: pos, end: pos, value: text.slice(0, pos) + text.slice(t), delFrom: pos, delTo: t };
        },
    },
    {
        id: 'delToEOL', context: 'global', driver: 'native', highlightType: 'delete',
        keysDisplay: 'Ctrl+Alt+Shift+;', instruction: 'Delete from the cursor to the end of the line.',
        trapNote: "Matches EigenNode's own Ctrl+Alt+Shift+; too.",
        samples: [
            { text: KN_S1, pos: KN_S1.indexOf('jumps') },
            { text: KN_S3, pos: KN_S3.indexOf('units') },
            { text: KN_S6, pos: KN_S6.indexOf('beat') },
        ],
        compute(text, pos) {
            const le = knLineBounds(text, pos).end;
            return { start: pos, end: pos, value: text.slice(0, pos) + text.slice(le), delFrom: pos, delTo: le };
        },
    },
    {
        id: 'delLine', context: 'global', driver: 'native', highlightType: 'delete',
        keysDisplay: 'Ctrl+Alt+;', instruction: 'Delete the entire current line.',
        trapNote: 'Matches EigenNode\'s own Ctrl+Alt+; ("delete item") too.',
        samples: [
            { text: KN_M1, pos: KN_M1.indexOf('third') + 3 },
            { text: KN_M3, pos: KN_M3.indexOf('wednesday') + 3 },
        ],
        compute(text, pos) {
            const home = knLineBounds(text, pos).start;
            const target = knMoveLines(text, home, 1);
            return { start: home, end: home, value: text.slice(0, home) + text.slice(target), delFrom: home, delTo: target };
        },
    },
    {
        id: 'selToEOL2', context: 'global', driver: 'native', highlightType: 'select',
        keysDisplay: "Ctrl+Alt+'", instruction: 'Highlight from the cursor to the end of the line (a second shortcut for the same result as Shift+Win+L).',
        samples: [
            { text: KN_S1, pos: KN_S1.indexOf('jumps') },
            { text: KN_S4, pos: KN_S4.indexOf('cut') },
            { text: KN_S5, pos: KN_S5.indexOf('trust') },
        ],
        compute(text, pos) { const t = knLineBounds(text, pos).end; return { start: Math.min(pos, t), end: Math.max(pos, t), value: text }; },
    },
    {
        id: 'docStart', context: 'global', driver: 'native', highlightType: 'move',
        keysDisplay: 'Ctrl+Shift+U', instruction: 'Jump to the very beginning of the whole text.',
        samples: [
            { text: KN_M1, pos: KN_M1.indexOf('third') + 3 },
            { text: KN_M3, pos: KN_M3.indexOf('thursday') + 3 },
        ],
        compute(text) { return { start: 0, end: 0, value: text }; },
    },
    {
        id: 'enGotoNodeStart', context: 'eigennode', driver: 'manual', highlightType: 'move',
        keysDisplay: 'Alt+G', instruction: 'In EigenNode: move the cursor to the very beginning of this node (not just this line).',
        trapNote: 'Different from the global Alt+H, which only goes to the start of the current line.',
        samples: [
            { text: KN_M1, pos: KN_M1.indexOf('fourth') + 3 },
            { text: KN_M3, pos: KN_M3.indexOf('friday') + 3 },
        ],
        chord: { ctrl: false, alt: true, shift: false, key: 'g' },
        compute(text) { return { start: 0, end: 0, value: text }; },
    },
    {
        id: 'enSelectToNodeStart', context: 'eigennode', driver: 'manual', highlightType: 'select',
        keysDisplay: 'Shift+Alt+G', instruction: 'In EigenNode: highlight from the cursor to the very beginning of this node.',
        samples: [
            { text: KN_M1, pos: KN_M1.indexOf('fourth') + 3 },
            { text: KN_M3, pos: KN_M3.indexOf('friday') + 3 },
        ],
        chord: { ctrl: false, alt: true, shift: true, key: 'g' },
        compute(text, pos) { return { start: 0, end: pos, value: text }; },
    },
    {
        id: 'enGotoNodeEnd', context: 'eigennode', driver: 'manual', highlightType: 'move',
        keysDisplay: 'Shift+Alt+L', instruction: 'In EigenNode: jump to the very end of this node, across all its lines.',
        trapNote: 'Different from the plain Alt+L, which only goes to the end of the current line.',
        samples: [
            { text: KN_M1, pos: KN_M1.indexOf('second') + 2 },
            { text: KN_M3, pos: KN_M3.indexOf('tuesday') + 2 },
        ],
        chord: { ctrl: false, alt: true, shift: true, key: 'l' },
        compute(text) { return { start: text.length, end: text.length, value: text }; },
    },
    {
        id: 'enDeleteToNodeEnd', context: 'eigennode', driver: 'manual', highlightType: 'delete',
        keysDisplay: 'Ctrl+Alt+Shift+;', instruction: 'In EigenNode: delete from the cursor to the end of this node, across all its lines.',
        trapNote: 'Plain Ctrl+Alt+; inside EigenNode instead deletes the whole node.',
        samples: [
            { text: KN_M1, pos: KN_M1.indexOf('third') + 3 },
            { text: KN_M3, pos: KN_M3.indexOf('wednesday') + 3 },
        ],
        chord: { ctrl: true, alt: true, shift: true, key: ';' },
        compute(text, pos) {
            return { start: pos, end: pos, value: text.slice(0, pos), delFrom: pos, delTo: text.length };
        },
    },
    {
        id: 'enDeleteWholeNode', context: 'eigennode', driver: 'quiz', highlightType: 'delete',
        keysDisplay: 'Ctrl+Alt+;',
        instruction: 'In EigenNode, which shortcut deletes this entire node — not just some text inside it?',
        trapNote: 'This matches the same combo everywhere else too - Ctrl+Alt+; always deletes the whole line or item now.',
        samples: [
            { text: 'Buy groceries for the week', pos: 10 },
            { text: 'Call the dentist tomorrow', pos: 8 },
            { text: 'Review pull request forty two', pos: 12 },
        ],
        choices: ['Ctrl+Alt+;', 'Ctrl+Alt+Shift+;', 'Ctrl+;', 'Backspace'],
        correctChoice: 'Ctrl+Alt+;',
    },
];

export class KeyboardShortcutsSkill extends Skill {
    constructor() {
        super('kb-shortcuts', 'Text Navigation Shortcuts');
        this.lastMoveId = null;
    }

    generateTrial() {
        let move;
        do {
            move = KB_MOVES[Math.floor(Math.random() * KB_MOVES.length)];
        } while (move.id === this.lastMoveId && KB_MOVES.length > 1);
        this.lastMoveId = move.id;
        const sample = move.samples[Math.floor(Math.random() * move.samples.length)];
        const badgeClass = move.context === 'eigennode' ? 'eigennode' : '';
        const badgeLabel = move.context === 'eigennode' ? 'EigenNode' : 'Anywhere';
        let inputHTML;

        if (move.driver === 'quiz') {
            const highlight = { type: 'delete', from: 0, to: sample.text.length };
            const preview = knRenderPreview(sample.text, sample.pos, highlight);
            const buttons = move.choices.map(c =>
                `<button type="button" class="kb-choice" data-choice="${knEscHtml(c)}">${knEscHtml(c)}</button>`
            ).join('');
            inputHTML = `
                <div class="kb-badge ${badgeClass}">${badgeLabel}</div>
                <div class="kb-preview">${preview}</div>
                <div class="kb-choices">${buttons}</div>
            `;
        } else {
            const finalState = move.compute(sample.text, sample.pos);
            let highlight;
            if (move.highlightType === 'move') {
                highlight = { type: 'move', to: finalState.start };
            } else if (move.highlightType === 'select') {
                highlight = { type: 'select', from: sample.pos, to: (finalState.start === sample.pos ? finalState.end : finalState.start) };
            } else {
                highlight = { type: 'delete', from: finalState.delFrom, to: finalState.delTo };
            }
            const preview = knRenderPreview(sample.text, sample.pos, highlight);
            const rows = Math.max(2, sample.text.split('\n').length);
            inputHTML = `
                <div class="kb-badge ${badgeClass}">${badgeLabel}</div>
                <div class="kb-preview">${preview}</div>
                <textarea class="kb-textarea" id="kbArea" wrap="off" spellcheck="false" rows="${rows}"></textarea>
            `;
        }

        return {
            question: move.instruction,
            inputHTML,
            correctAnswer: null,
            _move: move,
            _sample: sample,
        };
    }

    onTrialRendered(trial, inputArea, app) {
        const move = trial._move;
        const sample = trial._sample;
        const MODIFIER_KEYS = new Set(['Control', 'Alt', 'Shift', 'Meta', 'AltGraph', 'OS']);

        if (move.driver === 'quiz') {
            const buttons = inputArea.querySelectorAll('.kb-choice');
            let graded = false;

            const grade = (isCorrect, feedback) => {
                if (graded) return;
                graded = true;
                document.removeEventListener('keydown', bailListener);
                buttons.forEach(b => b.disabled = true);
                trial._liveResult = { correct: isCorrect, feedback };
                app.submitAnswer();
            };
            const bail = () => {
                if (graded) return;
                grade(false, `It's ${move.keysDisplay}. ${move.trapNote || ''}`);
            };
            const bailListener = (e) => {
                if (!graded && e.key === 'Enter') {
                    e.preventDefault();
                    bail();
                }
            };
            document.addEventListener('keydown', bailListener);

            buttons.forEach(btn => {
                btn.addEventListener('click', () => {
                    if (graded) return;
                    const chosen = btn.getAttribute('data-choice');
                    if (chosen === move.correctChoice) {
                        btn.style.borderColor = '#28a745';
                        grade(true, `${move.keysDisplay}. ${move.trapNote || ''}`);
                    } else {
                        knFlashWrong(btn);
                    }
                });
            });
            return;
        }

        const textarea = inputArea.querySelector('#kbArea');
        textarea.value = sample.text;
        textarea.setSelectionRange(sample.pos, sample.pos);

        const finalState = move.compute(sample.text, sample.pos);
        let graded = false;

        const grade = (isCorrect) => {
            if (graded) return;
            graded = true;
            textarea.value = finalState.value;
            textarea.setSelectionRange(finalState.start, finalState.end);
            textarea.readOnly = true;
            trial._liveResult = {
                correct: isCorrect,
                feedback: isCorrect
                    ? `${move.keysDisplay}${move.trapNote ? ' — ' + move.trapNote : ''}`
                    : `That's ${move.keysDisplay}.${move.trapNote ? ' ' + move.trapNote : ''}`,
            };
            app.submitAnswer();
        };
        const resetForRetry = () => {
            knFlashWrong(textarea);
            textarea.value = sample.text;
            textarea.setSelectionRange(sample.pos, sample.pos);
        };
        const bail = () => {
            if (graded) return;
            grade(false);
        };

        if (move.driver === 'manual') {
            textarea.addEventListener('keydown', (e) => {
                if (graded) return;
                if (e.key === 'Enter') {
                    e.preventDefault();
                    bail();
                    return;
                }
                // A chord builds up over several keydown events (e.g. Alt
                // down, then Shift down, then G down) - only the final,
                // non-modifier keydown represents a complete attempt.
                // Judging on the modifier-only keydowns in between would
                // call it wrong before the user finished pressing it.
                if (MODIFIER_KEYS.has(e.key)) return;
                const c = move.chord;
                const match = !!c.ctrl === e.ctrlKey && !!c.alt === e.altKey && !!c.shift === e.shiftKey
                    && e.key.toLowerCase() === c.key.toLowerCase();
                if (match) {
                    e.preventDefault();
                    grade(true);
                } else {
                    setTimeout(resetForRetry, 0);
                }
            });
        } else {
            let debounceTimer = null;
            textarea.addEventListener('keydown', (e) => {
                if (graded) return;
                if (e.key === 'Enter') {
                    e.preventDefault();
                    bail();
                }
            });
            textarea.addEventListener('keyup', (e) => {
                // The Enter that just advanced this trial moves focus to
                // this fresh textarea synchronously (inside the same
                // keypress handler), so its keyup fires here a moment
                // later even though it targeted the Continue button at
                // keydown time. None of the trained shortcuts use Enter,
                // so it's always safe to ignore it here.
                if (graded || e.key === 'Enter') return;
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    const ok = textarea.selectionStart === finalState.start
                        && textarea.selectionEnd === finalState.end
                        && textarea.value === finalState.value;
                    if (ok) {
                        grade(true);
                    } else {
                        resetForRetry();
                    }
                }, 220);
            });
        }
    }

    checkAnswer(trial) {
        const r = trial._liveResult || { correct: false, feedback: 'No action detected — try again next round.' };
        return { score: r.correct ? 1 : 0, correct: r.correct, feedback: r.feedback };
    }
}
