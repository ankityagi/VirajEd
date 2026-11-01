# Viraj's Math Quest

A small practice site for Viraj. Each tile on the home screen is one topic. Each topic has
**10 levels** that get harder as you go, with 10 fresh random questions per level
(no repeats within a level).

- Get **8 of 10** right to unlock the next level.
- Stars: 10/10 with no hints = 3 stars, 9 or more = 2 stars, 8 = 1 star.
- XP: +10 per correct answer (+5 if a hint was used).
- Progress is saved in the browser (localStorage).
- "Parent mode" on the level map unlocks every level for previewing.

## Run it

It's a static site, with no build step. Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
```

It also works as-is on GitHub Pages.

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
js/app.js                  game engine: home tiles, level map, play loop, results
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
