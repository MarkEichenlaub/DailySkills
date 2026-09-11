# Skill ideas

Candidates for new practice skills, roughly in the order they'd pay off.
"Auto" means the app can invent unlimited questions from a formula; "data"
means it needs a list of facts bundled in.

---

## 1. Keyboard navigation — the big one

Text Navigation Shortcuts already exists and drills 22 of your shortcuts. The
plan below turns one skill into a group, because "knowing the key" and "using
the key without thinking" are different things and only the second one saves
you time.

### 1a. Shortcuts you own but never use (auto)

Your AutoHotkey script defines these, and the app doesn't drill any of them:

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

Same trial format as now: an instruction, you press the keys, it grades you.

### 1b. Launcher recall (data, tiny)

Your CapsLock layer: G github, B Drive, S screenshots, D downloads, K EigenNode,
H HiTeXeR, V blink comparator, F gif editor, I Dynalist quick-add, N next
actions, E calendar capture, W send page to Claude, U AoPS sync, Y ggb-to-asy,
P PowerShell, R references, L documents, C C-drive, A arcade.

Prompt is the destination ("Open the blink comparator"), answer is the keys.
Pure recall, no text editing, so it's quick to build and quick to run.

### 1c. Edit-to-target (auto, the one that actually transfers)

Show a starting block of text and a target block. Get from one to the other
using only the keyboard. Score on keystrokes against the optimal path, not just
right/wrong.

This is the version that builds real speed, because you have to choose the
shortcut yourself instead of being told which one to press. It's also the most
work to build — it needs a small solver to know the optimal keystroke count.

### 1d. Reverse direction (auto, free)

Right now the app says "delete to the end of the line" and you press the keys.
Flip it: show the keys, ask what they do. Cheap to add, and it catches the
shortcuts you can execute from muscle memory but can't recall when you need
them somewhere new.

### 1e. Speed, not just accuracy

Whatever the format, start recording how long each trial takes and show a
personal best. Accuracy tops out fast on this skill; after that, time is the
only thing left to improve.

---

## 2. Estimating by eye

- **Length of a line** (auto) — show a line, guess its length in pixels, cm, or
  relative to a reference mark. Same shape as the angle skill.
- **Area or fraction shaded** (auto) — what fraction of this shape is filled?
- **Reading a value off a graph** (auto) — a plotted point, no gridlines at that
  spot, read off x and y.
- **Slope off a log-log plot** (auto) — is that a 1, a 2, or a 3/2? Directly
  useful for physics, and nobody is good at it without practice.
- **Vector sum direction** (auto) — two arrows, estimate the direction and
  rough length of the resultant.
- **Counting by eye** (auto) — a scatter of dots, how many? Trains the
  estimation reflex more generally.
- **Estimate from a photo** (data) — a photo with something of known size in it,
  estimate how tall or wide the other thing is.

---

## 3. Physics fluency

- **Powers of ten** (auto) — $3\times10^{-4}$ times $6\times10^{7}$, in your
  head, as scientific notation.
- **Dimensional check** (auto) — here's an expression, is it dimensionally
  consistent? Generate wrong ones by corrupting a real formula.
- **Unit conversion chains** (auto) — J to eV, atm to Pa, m/s to mph, K to °C.
- **Trig and small angles** (auto) — $\sin 30°$, $\cos 45°$, and "is
  $\sin\theta \approx \theta$ good enough at 0.3 rad?"
- **Constants to one sig fig** (data, small) — $c$, $G$, $k_B$, $\hbar$, $N_A$,
  $\epsilon_0$, $R$, $g$. Just the magnitude and the units.
- **Fermi estimates** (data) — how many piano tuners, how much does a cloud
  weigh. Graded loosely, within a factor of a few.
- **Graph shape matching** (auto) — position, velocity, acceleration. Given one,
  pick the other two.
- **Right-hand rule** (auto) — two vectors drawn, which way does the cross
  product point?
- **Logs and exponents** (auto) — $\log_{10} 3000$, $2^{12}$, $e^{-1}$.
- **Square roots** (auto) — $\sqrt{70}$ to two figures.

---

## 4. Daily life arithmetic

- **Metric and imperial** (auto) — miles/km, lbs/kg, inches/cm, gallons/liters,
  mph/(m/s). Same engine as the temperature skills, so nearly free to add.
- **Tips and splitting a bill** (auto) — 18% on $63.40, split four ways.
- **Percent off, percent change** (auto) — "$48 marked down 35%."
- **Unit price** (auto) — which is cheaper, 18 oz for $4.29 or 24 oz for $5.49?
- **Day of the week for any date** (auto) — the doomsday trick. Genuinely
  learnable in a few weeks of five-minute sessions.
- **Time zones** (data, small) — it's 3pm here, what time in Shanghai, London,
  San Diego.
- **Rule of 72 and doubling time** (auto) — 6% a year, how long to double.
- **Odds and probability** (auto) — 3:1 against means what percent?

---

## 5. Geography for the news

All of these need a bundled data set, but the data is small and public.

- **Find the country on a map** (data) — click it, no labels.
- **Capitals** (data) — both directions.
- **Who borders whom** (data) — name a neighbor of Chad.
- **Place the city** (data) — drop a pin, graded by distance in km.
- **Chokepoints and waterways** (data) — Hormuz, Bab el-Mandeb, Malacca, Suez,
  Panama, Bosphorus, Taiwan Strait, Kerch. These are the ones that show up in
  news stories and get assumed knowledge.
- **Bigger or smaller** (data) — population or area, two countries, pick the
  larger. Trains the sense of scale that makes news numbers mean something.
- **US states and capitals** (data) — the easy warm-up version.
- **Flags** (data) — low value, but cheap and good for a streak.

---

## Two structural changes worth making at the same time

- **A skill should be able to say how long it wants.** Angle estimation is fine
  in five minutes; edit-to-target wants ten.
- **Move the skill definitions out of `index.html`.** At twenty-odd skills, one
  file stops being convenient. A skill per file, or a JSON manifest for the
  data-driven ones, would let you add a geography set without touching the app.
