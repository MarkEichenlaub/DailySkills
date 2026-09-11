// The skill registry. Adding a skill means writing its module and listing it
// here - nothing else in the app needs to know about it.

import { KeyboardShortcutsSkill } from './keyboard.js';
import { EstimationSkill } from './estimation.js';
import { PhysicsFluencySkill } from './physics.js';
import { TrigSkill } from './trig.js';
import { DailyArithmeticSkill } from './daily.js';
import { GeographySkill } from './geography.js';
import { DoomsdaySkill } from './doomsday.js';
import { AngleEstimationSkill } from './angle.js';
import { FahrenheitToCelsiusSkill, CelsiusToFahrenheitSkill } from './temperature.js';

export function createSkills() {
    return [
        new KeyboardShortcutsSkill(),
        new EstimationSkill(),
        new PhysicsFluencySkill(),
        new TrigSkill(),
        new DailyArithmeticSkill(),
        new GeographySkill(),
        new DoomsdaySkill(),
        new AngleEstimationSkill(),
        new FahrenheitToCelsiusSkill(),
        new CelsiusToFahrenheitSkill(),
    ];
}
