import { COUNTRIES } from '../js/data/geography.js';
import { DoomsdaySkill } from '../js/skills/doomsday.js';

let fails = 0;
// Border lists must agree both ways for any pair that's in the data set,
// otherwise a real neighbor could be offered as a wrong answer.
const byName = new Map(COUNTRIES.map(c => [c.name, c]));
for (const c of COUNTRIES) {
    for (const b of c.borders) {
        const other = byName.get(b);
        if (other && !other.borders.includes(c.name)) {
            console.log('ASYMMETRIC BORDER:', c.name, '->', b, 'but not back'); fails++;
        }
    }
    if (c.borders.includes(c.name)) { console.log('SELF BORDER', c.name); fails++; }
}
const dupes = COUNTRIES.map(c=>c.name).filter((n,i,a)=>a.indexOf(n)!==i);
if (dupes.length) { console.log('DUPLICATE COUNTRIES', dupes); fails++; }
const capDupes = COUNTRIES.filter(c=>c.capital).map(c=>c.capital).filter((n,i,a)=>a.indexOf(n)!==i);
if (capDupes.length) { console.log('DUPLICATE CAPITALS', capDupes); fails++; }

// Doomsday should climb the stages when answered right and fall back when not.
const d = new DoomsdaySkill();
for (let i = 0; i < 40; i++) d.recordTrial(1, 1000, `stage${d.data.stage}`);
console.log('after 40 correct, stage =', d.data.stage, '(expect 5)');
if (d.data.stage !== 5) fails++;
for (let i = 0; i < 16; i++) d.recordTrial(0, 1000, `stage${d.data.stage}`);
console.log('after 16 wrong, stage =', d.data.stage, '(expect lower)');
if (d.data.stage >= 5) fails++;

// Every stage must generate and self-grade.
for (let s = 1; s <= 5; s++) {
    const k = new DoomsdaySkill(); k.data.stage = s;
    for (let i = 0; i < 500; i++) {
        const t = k.generateTrial();
        const r = k.checkAnswer(t, String(t.correctAnswer));
        if (!r.correct) { console.log('DOOMSDAY STAGE FAIL', s, t.question); fails++; break; }
        if (/undefined|NaN/.test(t.question + r.feedback)) { console.log('DOOMSDAY TEXT', s, t.question, r.feedback); fails++; break; }
    }
}
console.log(fails === 0 ? 'DATA + STAGE CHECKS PASSED' : `${fails} FAILURES`);
