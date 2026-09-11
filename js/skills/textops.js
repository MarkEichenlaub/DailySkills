// The text-editing model behind the keyboard skills.
//
// Each operation is one of Mark's real chords, modeled as a pure function on
// {text, pos, anchor}. `anchor` is null when nothing is selected; otherwise the
// selection runs between anchor and pos, and pos is where the caret actually is.
//
// Modeling them this way is what makes Edit to Target possible: with the ops as
// pure functions, a breadth-first search can work out the fewest keystrokes any
// given edit really needs, so a run can be scored against the best possible
// instead of just right-or-wrong.

export function segments(text) {
    const seg = new Intl.Segmenter(undefined, { granularity: 'word' });
    const out = [];
    let idx = 0;
    for (const s of seg.segment(text)) {
        out.push({ start: idx, end: idx + s.segment.length, isWordLike: s.isWordLike });
        idx += s.segment.length;
    }
    return out;
}

export function wordForward(text, pos) {
    for (const s of segments(text)) {
        if (s.isWordLike && s.start > pos) return s.start;
    }
    return text.length;
}

export function wordBack(text, pos) {
    const words = segments(text).filter(s => s.isWordLike && s.start < pos);
    return words.length ? words[words.length - 1].start : 0;
}

export function lineBounds(text, pos) {
    const start = text.lastIndexOf('\n', pos - 1) + 1;
    let end = text.indexOf('\n', pos);
    if (end === -1) end = text.length;
    return { start, end };
}

export function moveLines(text, pos, delta) {
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

// --- state helpers ----------------------------------------------------------

const st = (text, pos, anchor = null) => ({ text, pos, anchor });

function selection(s) {
    if (s.anchor === null) return null;
    return [Math.min(s.anchor, s.pos), Math.max(s.anchor, s.pos)];
}

// A move collapses any selection first, the way a plain arrow key does.
function collapsed(s, dir) {
    const sel = selection(s);
    if (!sel) return s.pos;
    return dir < 0 ? sel[0] : sel[1];
}

function cut(s, from, to) {
    const a = Math.max(0, Math.min(from, to));
    const b = Math.min(s.text.length, Math.max(from, to));
    if (a === b) return s;
    return st(s.text.slice(0, a) + s.text.slice(b), a, null);
}

// Deleting with a selection active removes the selection, whatever the key.
function deleteSelectionOr(s, fn) {
    const sel = selection(s);
    if (sel) return cut(s, sel[0], sel[1]);
    return fn(s);
}

// --- the operations ---------------------------------------------------------

// Every chord here is one Mark actually has bound in default.ahk. AutoHotkey
// turns each into the plain key in the comment, which a textarea handles
// natively - which is why they can be practiced live in a browser at all.
export const OPS = [
    { id: 'charLeft', keys: 'Ctrl+H', // Left
      apply: s => st(s.text, Math.max(0, selection(s) ? collapsed(s, -1) : s.pos - 1)) },
    { id: 'charRight', keys: 'Ctrl+L', // Right
      apply: s => st(s.text, Math.min(s.text.length, selection(s) ? collapsed(s, 1) : s.pos + 1)) },
    { id: 'wordLeft', keys: 'Ctrl+Shift+H', // Ctrl+Left
      apply: s => st(s.text, wordBack(s.text, collapsed(s, -1))) },
    { id: 'wordRight', keys: 'Ctrl+Shift+L', // Ctrl+Right
      apply: s => st(s.text, wordForward(s.text, collapsed(s, 1))) },
    { id: 'home', keys: 'Alt+H', // Home
      apply: s => st(s.text, lineBounds(s.text, collapsed(s, -1)).start) },
    { id: 'end', keys: 'Alt+L', // End
      apply: s => st(s.text, lineBounds(s.text, collapsed(s, 1)).end) },
    { id: 'selHome', keys: 'Shift+Win+H', // Shift+Home
      apply: s => st(s.text, lineBounds(s.text, s.pos).start, s.anchor === null ? s.pos : s.anchor) },
    { id: 'selEnd', keys: 'Shift+Win+L', // Shift+End
      apply: s => st(s.text, lineBounds(s.text, s.pos).end, s.anchor === null ? s.pos : s.anchor) },
    { id: 'lineDown', keys: 'Ctrl+J', // Down
      apply: s => st(s.text, moveLines(s.text, collapsed(s, 1), 1)) },
    { id: 'lineUp', keys: 'Ctrl+K', // Up
      apply: s => st(s.text, moveLines(s.text, collapsed(s, -1), -1)) },
    { id: 'selLineDown', keys: 'Ctrl+Shift+J', // Shift+Down
      apply: s => st(s.text, moveLines(s.text, s.pos, 1), s.anchor === null ? s.pos : s.anchor) },
    { id: 'selLineUp', keys: 'Ctrl+Shift+K', // Shift+Up
      apply: s => st(s.text, moveLines(s.text, s.pos, -1), s.anchor === null ? s.pos : s.anchor) },
    { id: 'docStart', keys: 'Ctrl+Shift+U', // Ctrl+Home
      apply: s => st(s.text, 0) },
    { id: 'delChar', keys: 'Ctrl+;', // Delete
      apply: s => deleteSelectionOr(s, x => cut(x, x.pos, x.pos + 1)) },
    { id: 'delWord', keys: 'Ctrl+Shift+;', // Ctrl+Delete
      apply: s => deleteSelectionOr(s, x => cut(x, x.pos, wordForward(x.text, x.pos))) },
    { id: 'delToEOL', keys: 'Ctrl+Alt+Shift+;', // Shift+End, Backspace
      apply: s => {
          const lineEnd = lineBounds(s.text, s.pos).end;
          // Shift+End selects nothing when the caret is already at the end of
          // the line, and the Backspace then eats the character before it.
          // That is what really happens, so that is what gets practiced.
          if (lineEnd === s.pos) return cut(s, s.pos - 1, s.pos);
          return cut(s, s.pos, lineEnd);
      } },
    { id: 'delLine', keys: 'Ctrl+Alt+;', // Home, Shift+Down, Delete
      apply: s => {
          const { start } = lineBounds(s.text, s.pos);
          const to = moveLines(s.text, start, 1);
          // On the last line there is no line below to select down to, so take
          // everything from here to the end of the text.
          return cut(s, start, to === start ? s.text.length : to);
      } },
];

export const OP_BY_ID = Object.fromEntries(OPS.map(o => [o.id, o]));

function key(s) {
    return `${s.pos}|${s.anchor}|${s.text}`;
}

// Breadth-first over the operations, recording for each distinct *text* the
// fewest keystrokes that produce it, and one sequence of chords that gets
// there. Text is what the target is judged on, so that minimum is exactly the
// number to beat - and the path is what to show when the run wasn't optimal.
//
// Returns Map<text, {cost, path}> where path is an array of op ids.
export function reachableTexts(start, maxDepth = 4, cap = 60000) {
    const seen = new Set([key(start)]);
    const best = new Map([[start.text, { cost: 0, path: [] }]]);
    let frontier = [{ state: start, path: [] }];

    for (let depth = 1; depth <= maxDepth; depth++) {
        const next = [];
        for (const { state, path } of frontier) {
            for (const op of OPS) {
                let n;
                try { n = op.apply(state); } catch { continue; }
                if (!n) continue;
                const k = key(n);
                if (seen.has(k)) continue;
                seen.add(k);
                const nextPath = [...path, op.id];
                if (!best.has(n.text)) best.set(n.text, { cost: depth, path: nextPath });
                next.push({ state: n, path: nextPath });
                if (seen.size > cap) return best;
            }
        }
        if (!next.length) break;
        frontier = next;
    }
    return best;
}
