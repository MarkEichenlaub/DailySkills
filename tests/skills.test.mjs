import { EstimationSkill } from '../js/skills/estimation.js';
import { PhysicsFluencySkill, parseSci } from '../js/skills/physics.js';
import { TrigSkill } from '../js/skills/trig.js';
import { DailyArithmeticSkill } from '../js/skills/daily.js';
import { GeographySkill } from '../js/skills/geography.js';
import { DoomsdaySkill } from '../js/skills/doomsday.js';
import { COUNTRIES } from '../js/data/geography.js';

const skills = [new EstimationSkill(), new PhysicsFluencySkill(), new TrigSkill(),
                new DailyArithmeticSkill(), new GeographySkill(), new DoomsdaySkill()];

let fails = 0;
for (const s of skills) {
    const seen = new Set();
    for (let i = 0; i < 3000; i++) {
        let t;
        try { t = s.generateTrial(); } catch (e) { console.log('GEN FAIL', s.id, e.message); fails++; break; }
        if (!t.question || t.inputHTML == null) { console.log('EMPTY', s.id, JSON.stringify(t).slice(0,150)); fails++; break; }
        if (/undefined|NaN/.test(t.question)) { console.log('BAD TEXT', s.id, t.question); fails++; break; }
        seen.add(t.tag);
        // Grade the correct answer and confirm it scores 1.
        let ans;
        if (typeof t.correctAnswer === 'number' && /radio/.test(t.inputHTML)) ans = String(t.correctAnswer);
        else if (t.tag === 'tz') ans = null;
        else if (typeof t.correctAnswer === 'number') ans = String(t.correctAnswer);
        else ans = null;
        if (ans !== null) {
            let r;
            try { r = s.checkAnswer(t, ans); } catch (e) { console.log('CHECK FAIL', s.id, t.tag, e.message); fails++; break; }
            if (!r.correct) { console.log('SELF-GRADE FAIL', s.id, t.tag, '|', t.question.slice(0,70), '| ans', ans, '| fb', r.feedback); fails++; break; }
            if (/undefined|NaN/.test(r.feedback)) { console.log('BAD FEEDBACK', s.id, t.tag, r.feedback); fails++; break; }
        }
    }
    console.log(s.id, '->', [...seen].join(','));
}

// time-zone answers are strings
const d = new DailyArithmeticSkill();
for (let i = 0; i < 500; i++) {
    const t = d.types.find(x => x.tag === 'tz').make(); t.tag='tz';
    const hh = Math.floor(t.correctAnswer), mm = Math.round((t.correctAnswer-hh)*60);
    const r = d.checkAnswer(t, `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`);
    if (!r.correct) { console.log('TZ FAIL', t.question, r.feedback); fails++; break; }
}

console.log('parseSci:', parseSci('1.8e12'), parseSci('1.8x10^12'), parseSci('1.8*10^-3'), parseSci('42'), parseSci('10^5'));
console.log('countries:', COUNTRIES.length, 'with capital:', COUNTRIES.filter(c=>c.capital&&!c.noCapital).length);
console.log(fails === 0 ? 'ALL SMOKE TESTS PASSED' : `${fails} FAILURES`);
