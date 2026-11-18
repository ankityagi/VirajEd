# Viraj's Math Quest

A small practice site for Viraj. Each tile on the home screen is one topic. Each topic has
**10 levels** that get harder as you go, with 10 fresh random questions per level
(no repeats within a level).

- Get **8 of 10** right to unlock the next level.
- Stars: 10/10 with no hints = 3 stars, 9 or more = 2 stars, 8 = 1 star.
- XP: +10 per correct answer (+5 if a hint was used).
- Progress is saved in the browser (localStorage).
- "Parent mode" on the level map unlocks every level for previewing. It needs a parent PIN,
  chosen on the device the first time (only a hash is stored, with the progress), and it
  switches off again when the page is reloaded. This keeps a child out; it is not real security.

## Coins and play time (BrainPlay)

Stars earn coins, and coins buy play time on BrainPlay (games.ankityagi.online).

- **Earning:** each level's best stars count once (replaying a level earns nothing new). A parent
  sets the rate under *Parent → Settings → Coins for play time*: stars for 1 coin (1 to 10) and
  minutes of play for 1 coin (5, 10, 15 or 20). Defaults: 1 star = 1 coin = 5 minutes.
  The rate is saved on the device and as a file in the progress log
  (`players/p1/settings/coins/<time>.json`, newest wins), so it reaches his other devices.
- **Spending:** the 🪙 pill in the header, or the coin bar on the home screen, opens *Get play time*.
  He picks minutes, confirms, and the coins come off. Each spend is saved on the device and in the
  log at `players/p1/spends/YYYY/MM/<time>.json` (coins, minutes, code, day).
- **Balance** = coins from stars − coins spent (this device's spends plus the log's).
- **Code:** he gets a 6-character code such as `K7Q-2MX` to type into BrainPlay. It works only on
  the day it was made, and BrainPlay accepts each code once.

### Play code format (`js/playcode.js`)

`js/playcode.js` is self-contained, so the same file goes into Vihaan's site and BrainPlay.

- 6 characters of Crockford base32 (`0-9 A-Z` without `I L O U`), shown as `XXX-XXX`.
  When checking, dashes and spaces are dropped and `O`→`0`, `I`/`L`→`1`.
- 30 bits, high to low: **kid** 2 bits (0 = p1 Viraj, 1 = p2 Vihaan, 2 = p3, 3 = p4),
  **minutes** 4 bits (index `i`, minutes = 5 × (i + 1), so 5 to 80), **nonce** 8 bits (random,
  unique per kid per day on the device), **sig** 16 bits.
- `sig` = first 16 bits of `HMAC-SHA256(KEY, "bp1|<kid>|<i>|<nonce>|<YYYY-MM-DD>")`, where the date
  is the device's local date. The date is not in the code: the checker signs with *its own* today,
  so yesterday's codes fail.
- `PlayCode.check(text)` returns `{ ok, player, minutes, code }` or `{ ok: false, reason }`.
  BrainPlay should also keep a list of codes already used today and refuse repeats.
- The key is in public page code, so someone who reads the source could make codes. That is fine
  for a kids' reward; a small server could hold the key later.

## Run it

It's a static site, with no build step. Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
```

## Logins and the progress log

- **Login:** players are listed in `PLAYERS` in `js/app.js` (Viraj is code `p1`). Each picks a
  PIN on first login and stays logged in on that device until *Log out*. A parent can reset a
  forgotten PIN.
- **Progress log:** every level played (finished, or quit after at least one answer) is saved as
  one JSON text file in the public repo **ankityagi/mathquest-progress**, at
  `players/p1/sessions/YYYY/MM/<time>-<quest>-L<level>.json`. The files hold only the player
  code, never a name: each answer, right or wrong, seconds taken, and whether a hint was used.
- **Saving** needs a fine-grained GitHub token, entered once on the child's device under
  *Parent → Settings*. Until then, and whenever offline, levels wait in a queue on the device
  and upload later. **Reading** needs no token, so the report works on any device.
- **Report** (*Parent* link at the bottom of every page): levels played, accuracy, typical time
  per question, what to work on next (question types under 75% correct or 1.6× slower than his
  typical time), strong and quick types, results by area, tries per level, recent sessions.
  Logging in on a new device brings stars and XP over from the log.

### One-time setup for saving

1. Create a **public** repo `ankityagi/mathquest-progress` (tick *Add a README* so it has a `main` branch).
2. GitHub → Settings → Developer settings → **Fine-grained tokens** → *Generate new token*:
   repository access **Only select repositories → mathquest-progress**, permission
   **Contents: Read and write**, and an expiry date.
3. On Viraj's device: **Parent** → **Settings** → paste the token → **Save and test**.

## Parent dashboard: viraj.ankityagi.online/admin.html

A full-page dashboard (`admin.html`, `js/admin.js`, `css/admin.css`) built from the same
progress log. It opens with the parent PIN of the device (or sets one on first use) and
reads the public data repo directly, so it works on any phone or computer with no token.
It shows:

- totals: time practising, questions, percent correct, levels cleared, typical time per question
- **What stands out**: plain-English highlights (levels cleared after many tries, perfect
  levels, his most common slip with an example, mix-ups, levels he quits a lot, slowest type)
- minutes practised and percent correct per day
- a **quest map** of all 70 levels: stars, tried-but-not-cleared, not tried (hover for tries)
- **speed vs accuracy** for every question type, with the ones that need work highlighted
- **work on next**: weakest question types with an example wrong answer
- **mistake patterns**: wrong answers grouped into numbers written side by side
  (6 min 12 s → 612), a lost or extra zero (80 × 30 → 240), small slips (within 5%),
  multiple-choice mix-ups (with the exact pairs he confuses) and other
- tries per level (with quits and the try he cleared it on), and every session with each
  question, his answer and the time taken

The date range (7 days, 30 days, all time) is remembered on the device.

## Hosting: viraj.ankityagi.online

The site is published with GitHub Pages, the same way as games.ankityagi.online.
`.github/workflows/deploy.yml` uploads `index.html`, `css/` and `js/` on every push,
and `CNAME` names the domain. One-time setup:

1. **DNS** (at the registrar for ankityagi.online): add a `CNAME` record,
   host `viraj`, value `ankityagi.github.io` — the same kind of record as `games`.
2. **GitHub → VirajEd → Settings → Pages**: set *Source* to **GitHub Actions**,
   enter `viraj.ankityagi.online` as the custom domain, and tick *Enforce HTTPS*
   once the certificate is issued.
3. This repo is **private**. Pages on a private repo needs a paid GitHub plan
   (Pro or higher); otherwise make the repo public. The published site itself
   is public either way.
4. Re-run the workflow (Actions → *Deploy to GitHub Pages* → *Run workflow*) or push.

## Layout

```
index.html                 page shell
css/style.css              all styling (light + dark)
js/draw.js                 SVG helpers: labelled shapes, bar graphs, line plots, picture graphs, fraction bars, angles, protractor, clock, lines
js/topics/measurement.js   Measurement & Area: 10 levels of question generators
js/topics/time-money.js    Time & Money: 10 levels (elapsed time, schedules, coins, change)
js/topics/graphs.js        Graphs & Line Plots: 10 levels (bar/picture graphs, tables, fraction line plots)
js/topics/fractions.js     Fractions: 10 levels (equivalent, compare, add/subtract, mixed numbers, ×, tenths/hundredths)
js/topics/multiply.js      Big Multiplication: 10 levels (×10s, area model, 2-digit × 2-digit, long division, remainders)
js/topics/angles.js        Angles & Lines: 10 levels (angle types, lines/rays, protractor, turns, missing angles, triangles)
js/topics/patterns.js      Patterns & Rules: 10 levels (sequences, in/out tables, times as many, solve for n, word problems)
js/playcode.js             play-time codes: make and check (shared with BrainPlay)
js/app.js                  game engine: home tiles, level map, play loop, results, coins
```

## How topics are organised

The home screen groups quests into the four areas from Viraj's school score report
(i-Ready / Smarter Balanced): Measurement & Data, Numbers & Operations, Algebra & Patterns,
and Geometry. Measurement & Data is tagged as the focus area because it was his lowest
sub-score in Fall 2026 (Grade 4). The areas live in `AREAS` at the top of `js/app.js`.
Each topic sets `area: 'md' | 'nbt' | 'oa' | 'geo'`.

## Adding a topic

Create `js/topics/<topic>.js` that pushes onto `window.VQ_TOPICS`
(copy the shape of `measurement.js`), then add a `<script>` tag for it in `index.html`
before `js/app.js`. Each level is `{ title, skill, variants: [fn, ...] }` and each
variant returns a new random question:

```js
{ prompt, fig?, answer: 42, unit: 'sq cm', hint, explain }           // typed answer
{ prompt, choices: ['Area', 'Perimeter'], answer: 0, hint, explain }  // multiple choice
{ prompt, answer: 1.75, answerText: '1¾', frac: true, unit: 'in', ... } // fraction answer
```

Typed answers accept whole numbers, decimals, money (`$4.85`) and fractions
(`3/4`, `1 3/4`, `1-3/4`).

Topics listed as "Coming soon" live in the `COMING` list at the top of `js/app.js`;
a real topic with the same `id` replaces its placeholder automatically.
