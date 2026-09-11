import { EditToTargetSkill } from '../js/skills/edit-target.js';
import { ShortcutRecallSkill } from '../js/skills/shortcut-recall.js';
import { OP_BY_ID, reachableTexts } from '../js/skills/textops.js';

let fails = 0;

// The claimed optimal route must actually produce the target, in exactly the
// claimed number of keystrokes. This checks the model and the search together.
const et = new EditToTargetSkill();
const costs = {};
for (let i = 0; i < 250; i++) {
    const t = et.generateTrial();
    let s = { text: t._startText, pos: t._startPos, anchor: null };
    for (const id of t._path) s = OP_BY_ID[id].apply(s);
    if (s.text !== t._target.text) {
        console.log('PATH DOES NOT REACH TARGET');
        console.log('  start :', JSON.stringify(t._startText), '@', t._startPos);
        console.log('  path  :', t._path.join(' -> '));
        console.log('  got   :', JSON.stringify(s.text));
        console.log('  want  :', JSON.stringify(t._target.text));
        fails++; break;
    }
    if (t._path.length !== t._optimal) { console.log('PATH LENGTH != COST', t._path.length, t._optimal); fails++; break; }
    if (t._optimal < 2 || t._optimal > 4) { console.log('COST OUT OF RANGE', t._optimal); fails++; break; }
    if (t._target.text === t._startText) { console.log('TARGET EQUALS START'); fails++; break; }
    costs[t._optimal] = (costs[t._optimal] || 0) + 1;
}
console.log('edit-target: 250 trials, costs', costs);

// No shorter route may exist than the one claimed.
for (let i = 0; i < 60; i++) {
    const t = et.generateTrial();
    const reach = reachableTexts({ text: t._startText, pos: t._startPos, anchor: null }, t._optimal - 1);
    if (reach.has(t._target.text)) { console.log('CLAIMED OPTIMUM IS NOT OPTIMAL', t._optimal, t._path.join(' -> ')); fails++; break; }
}
console.log('edit-target: no shorter route exists for 60 sampled targets');

// Shortcut recall: the right answer must grade correct, and no duplicate keys.
const sr = new ShortcutRecallSkill();
const seenTags = new Set();
for (let i = 0; i < 1500; i++) {
    const t = sr.generateTrial();
    seenTags.add(t.tag);
    if (new Set(t._options).size !== t._options.length) { console.log('DUPLICATE OPTIONS', t.question, t._options); fails++; break; }
    const r = sr.checkAnswer(t, String(t.correctAnswer));
    if (!r.correct) { console.log('SELF-GRADE FAIL', t.question, r.feedback); fails++; break; }
    if (/undefined|NaN/.test(t.question + r.feedback)) { console.log('BAD TEXT', t.question, r.feedback); fails++; break; }
}
console.log('shortcut-recall types:', [...seenTags].join(','));

console.log(fails === 0 ? 'KEYBOARD TESTS PASSED' : `${fails} FAILURES`);
