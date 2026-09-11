# Skill ideas

What's built, and what's still on the list. Adding a skill means writing one
module in `js/skills/` and listing it in `js/skills/index.js`.

---

## Built

Every one of these interleaves its own question types: within a session any kind
can come up, but a session never jumps between skills.

- **Text Navigation Shortcuts** — 22 of Mark's own AutoHotkey and EigenNode
  shortcuts, drilled live in a textarea.
- **Estimating by Eye** — length against a reference, fraction shaded, reading a
  value off a curve, slope on log-log axes, direction of a vector sum, counting a
  scatter of dots.
- **Physics Fluency** — powers of ten, unit conversions (eV, atm, light years,
  amu, kWh…), constants to one significant figure, dimensional-consistency
  checks, logs and exponentials, roots and squares.
- **Sine, Cosine, Tangent** — degree arguments, graded to about two decimals.
- **Daily Arithmetic** — metric and imperial, tips and splitting a bill, percent
  off, percent change, better-deal-per-unit, time zones, doubling time, odds.
- **Geography for the News** — capitals both directions, land neighbors,
  bigger-or-smaller by population and area, region, and the waterways that news
  stories assume you know (Hormuz, Bab el-Mandeb, Malacca, Kerch, and the rest).
- **Day of the Week** — Conway's doomsday method, taught in five stages with the
  guide on screen. It moves you up a stage once you're reliable and back down if
  you stop being.
- **Angle Estimation**, **Fahrenheit to Celsius**, **Celsius to Fahrenheit** —
  the originals, still here.

Every trial is timed. The practice screen shows the running average for the
session and your best ever on that skill; the home page shows best and typical
time per skill.

---

## Still on the list

### Keyboard navigation, the rest of the plan

**Shortcuts you own but never practice.** The AutoHotkey script defines a second
tier the app doesn't drill yet:

| Keys | What it does |
|---|---|
| Ctrl+9 / Ctrl+0 | Previous / next browser tab |
| Ctrl+Shift+9 / Ctrl+Shift+0 | Move the current tab left / right |
| Ctrl+Alt+Z / Ctrl+Alt+Y | Back / forward |
| Ctrl+Win+H / Ctrl+Win+L | Snap window left / right |
| Ctrl+Win+I / Ctrl+Win+M | Maximize / minimize |
| Ctrl+Alt+' | Select to end of line |
| Alt+Shift+J / Alt+Shift+K | Next / previous sibling in EigenNode |
| Ctrl+Alt+J / Ctrl+Alt+K | Scroll down / up |

**Launcher recall.** The CapsLock layer: G github, B Drive, S screenshots,
D downloads, K EigenNode, H HiTeXeR, V blink comparator, F gif editor, I Dynalist
quick-add, N next actions, E calendar capture, W send page to Claude, U AoPS sync,
Y ggb-to-asy, P PowerShell, R references, L documents, C C-drive, A arcade.
Prompt is the destination, answer is the keys.

**Edit-to-target.** A starting block of text and a target block; get from one to
the other on the keyboard, scored on keystrokes against the optimal path. The
version that actually builds speed, and the most work to build — it needs a
solver that knows the best possible keystroke count.

### Geography on a map

Click the country on an unlabeled map, and drop a pin on a city graded by
distance in km. Both need a world map bundled into the repo, which is why they're
not in yet.

### Estimating from a photo

A photo with something of known size in it, estimate how tall the other thing is.
Needs a small photo set rather than generated drawings.

### Elsewhere

- Free-body diagrams: which forces act, as multiple choice.
- Graph shape matching for position, velocity, acceleration.
- Right-hand rule on two drawn vectors.
- Mandarin vocabulary, if it's ever worth having outside Anki.
