import { Skill, choiceInput, choice, randInt, shuffled } from './base.js';

// Day of the week for any date, using Conway's doomsday method.
//
// This one is taught rather than just drilled: it starts on the pieces, and only
// puts them together once each piece is solid. The guide is on screen the whole
// time, so nothing has to be memorized before you can start.

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

function isLeap(y) {
    return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

// The date in each month that always lands on that year's doomsday.
function doomsdayDate(month, year) {
    const leap = isLeap(year);
    return [leap ? 4 : 3, leap ? 29 : 28, 7, 4, 9, 6, 11, 8, 5, 10, 7, 12][month - 1];
}

// Century anchor: 1700s Sunday, 1800s Friday, 1900s Wednesday, 2000s Tuesday,
// then the same four repeat.
function centuryAnchor(year) {
    return [2, 0, 5, 3][Math.floor(year / 100) % 4];
}

function yearDoomsday(year) {
    const yy = year % 100;
    const a = Math.floor(yy / 12);
    const b = yy % 12;
    const c = Math.floor(b / 4);
    return (centuryAnchor(year) + a + b + c) % 7;
}

// Ground truth comes from the calendar itself, never from the method being
// taught - otherwise a bug in the method would silently grade you wrong.
function actualWeekday(year, month, day) {
    return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

const GUIDE = `
<details class="guide">
<summary>How the doomsday method works</summary>
<div class="guide-body">
<p><strong>The idea.</strong> Every year has one weekday, called its <em>doomsday</em>,
and a handful of easy dates always land on it. Get the year's doomsday, walk to the
nearest easy date, then count days.</p>

<p><strong>Step 1 — the easy dates.</strong> In any year these all fall on doomsday:</p>
<ul>
<li>4/4, 6/6, 8/8, 10/10, 12/12 — the even months matched to themselves</li>
<li>5/9, 9/5, 7/11, 11/7 — "I work 9 to 5 at the 7-11"</li>
<li>The last day of February: the 28th normally, the 29th in a leap year</li>
<li>March: the 7th (think of it as "March 0", the day after the last of February)</li>
<li>January: the 3rd normally, the 4th in a leap year</li>
</ul>

<p><strong>Step 2 — the century.</strong> Each century starts from an anchor day:
1700s Sunday, 1800s Friday, 1900s Wednesday, 2000s Tuesday. Then it repeats.</p>

<p><strong>Step 3 — the year.</strong> Take the last two digits. Count how many
12s fit in (call it <em>a</em>), what's left over (<em>b</em>), and how many 4s
fit into that leftover (<em>c</em>). Add <em>a + b + c</em> to the century
anchor, then take the remainder on division by 7.</p>

<p>So for 1987: 87 = 7×12 + 3, so a = 7 and b = 3, and c = 0. The 1900s anchor is
Wednesday, and 7 + 3 + 0 = 10, which is 3 past a multiple of 7. Three days after
Wednesday is Saturday, so doomsday 1987 is Saturday.</p>

<p><strong>Step 4 — the date.</strong> Find the nearest easy date in that month and
count forward or back. July 4th 1987: July's easy date is the 11th, which is a
Saturday, so the 4th is exactly a week earlier — also Saturday.</p>
</div>
</details>`;

const STAGES = [
    {
        n: 1,
        label: 'Step 1 — the easy date in each month',
        make() {
            const month = randInt(1, 12);
            // January and February shift in a leap year, so the year matters.
            const needsYear = month <= 2;
            const year = needsYear ? choice([2024, 2023, 2000, 1900, 2019, 2020]) : null;
            const right = doomsdayDate(month, year || 2023);
            const label = d => `${MONTHS[month - 1]} ${d}`;
            const pool = [];
            for (let d = 1; d <= 29; d++) {
                if (d !== right) pool.push(label(d));
            }
            const options = shuffled([label(right), ...shuffled(pool).slice(0, 3)]);
            return {
                question: needsYear
                    ? `In ${year}, which date in ${MONTHS[month - 1]} falls on doomsday?`
                    : `Which date in ${MONTHS[month - 1]} always falls on doomsday?`,
                options,
                correctAnswer: options.indexOf(label(right)),
            };
        },
    },
    {
        n: 2,
        label: 'Step 2 — the century anchor',
        make() {
            const century = choice([1700, 1800, 1900, 2000, 2100, 2200]);
            const right = DAYS[centuryAnchor(century)];
            const options = shuffled([right, ...shuffled(DAYS.filter(d => d !== right)).slice(0, 3)]);
            return {
                question: `What is the anchor day for the ${century}s?`,
                options,
                correctAnswer: options.indexOf(right),
            };
        },
    },
    {
        n: 3,
        label: "Step 3 — the year's doomsday",
        make() {
            const year = randInt(1900, 2099);
            const right = DAYS[yearDoomsday(year)];
            const options = shuffled([right, ...shuffled(DAYS.filter(d => d !== right)).slice(0, 3)]);
            return {
                question: `What weekday is doomsday in ${year}?`,
                options,
                correctAnswer: options.indexOf(right),
                note: `${year}: anchor ${DAYS[centuryAnchor(year)]}, then the last two digits give ${(yearDoomsday(year) - centuryAnchor(year) + 70) % 7} more days.`,
            };
        },
    },
    {
        n: 4,
        label: 'Step 4 — a date, with doomsday handed to you',
        make() {
            const year = randInt(1900, 2099);
            const month = randInt(1, 12);
            const day = randInt(1, 28);
            const right = DAYS[actualWeekday(year, month, day)];
            const options = shuffled([right, ...shuffled(DAYS.filter(d => d !== right)).slice(0, 3)]);
            return {
                question: `Doomsday in ${year} is a ${DAYS[yearDoomsday(year)]}. What day of the week is ${MONTHS[month - 1]} ${day}, ${year}?`,
                options,
                correctAnswer: options.indexOf(right),
                note: `${MONTHS[month - 1]}'s easy date is the ${doomsdayDate(month, year)}th.`,
            };
        },
    },
    {
        n: 5,
        label: 'The whole thing',
        make() {
            const year = randInt(1900, 2099);
            const month = randInt(1, 12);
            const day = randInt(1, 28);
            const right = DAYS[actualWeekday(year, month, day)];
            const options = shuffled([right, ...shuffled(DAYS.filter(d => d !== right)).slice(0, 3)]);
            return {
                question: `What day of the week is ${MONTHS[month - 1]} ${day}, ${year}?`,
                options,
                correctAnswer: options.indexOf(right),
                note: `Doomsday ${year} is ${DAYS[yearDoomsday(year)]}; ${MONTHS[month - 1]}'s easy date is the ${doomsdayDate(month, year)}th.`,
            };
        },
    },
];

export class DoomsdaySkill extends Skill {
    constructor() {
        super('doomsday', 'Day of the Week');
        this.data.stage = 1;
    }

    loadData(data) {
        super.loadData(data);
        if (!this.data.stage) this.data.stage = 1;
    }

    currentStage() {
        return STAGES[Math.min(this.data.stage, STAGES.length) - 1];
    }

    generateTrial() {
        const stage = this.currentStage();
        const t = stage.make();
        return {
            question: t.question,
            inputHTML: choiceInput(t.options) + GUIDE,
            correctAnswer: t.correctAnswer,
            typeName: stage.label,
            tag: `stage${stage.n}`,
            _options: t.options,
            _note: t.note || null,
        };
    }

    checkAnswer(trial, answer) {
        const picked = parseInt(answer, 10);
        const isCorrect = picked === trial.correctAnswer;
        const right = trial._options[trial.correctAnswer];
        const note = trial._note ? ` ${trial._note}` : '';
        return {
            score: isCorrect ? 1 : 0,
            correct: isCorrect,
            feedback: (isCorrect ? right : `Answer: ${right}.`) + note,
        };
    }

    // Move up a step once the current one is reliably solid, and drop back a
    // step if it stops being solid.
    recordTrial(score, ms, tag) {
        super.recordTrial(score, ms, tag);
        const tagName = `stage${this.data.stage}`;
        const recent = this.data.history.filter(h => h.tag === tagName).slice(-8);
        if (recent.length >= 8) {
            const hits = recent.filter(h => h.score === 1).length;
            if (hits >= 7 && this.data.stage < STAGES.length) {
                this.data.stage++;
            } else if (hits <= 3 && this.data.stage > 1) {
                this.data.stage--;
            }
        }
    }
}
