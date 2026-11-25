import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const data = require('./cards.js');
const engine = require('./game.js');

const { CARDS, METRICS, CHARACTERS, LESSON_CONTENT } = data;
const {
  STORAGE_VERSION,
  INITIAL_SCORE,
  computeStateFromChoices,
  applyChoiceToState,
  sanitizeSavedState
} = engine;

// 1. Validate structure, static config files, and referenced relative assets
assert.equal(CARDS.length, 10, 'Must have exactly 10 cards');
assert.equal(METRICS.length, 4, 'Must have exactly 4 metrics');
assert.equal(LESSON_CONTENT.characteristics.length, 5, 'Must have exactly 5 characteristics');

const requiredFiles = [
  '.nojekyll',
  '.gitignore',
  'index.html',
  'styles.css',
  'cards.js',
  'game.js',
  'assets/og-share.png',
  'assets/nen-doc.webp',
  'assets/nen-doc.png',
  'assets/nen-ngang.webp',
  ...METRICS.map((m) => m.icon),
  ...LESSON_CONTENT.characteristics.map((c) => c.icon),
  ...Object.values(CHARACTERS).flatMap((ch) => [ch.portrait, ch.portrait2x])
];

for (const rel of requiredFiles) {
  const full = path.join(__dirname, rel);
  assert.ok(fs.existsSync(full), `Missing required file: ${rel}`);
}

// Validate HTML & CSS regressions
const htmlText = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
for (const expectedSnippet of [
  'property="og:image" content="assets/og-share.png"',
  'id="confirm-modal"',
  'id="feedback-situation-echo"',
  'id="btn-preview-summary"',
  'id="btn-present-card7"'
]) {
  assert.ok(htmlText.includes(expectedSnippet), `index.html missing expected snippet: ${expectedSnippet}`);
}

const cssText = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');
const metricLabelBlock = cssText.match(/\.metric-label\s*\{[^}]*\}/);
assert.ok(metricLabelBlock, 'Missing .metric-label rule in styles.css');
assert.ok(
  !metricLabelBlock[0].includes('nowrap'),
  '.metric-label must not force white-space: nowrap (prevents collision in narrow summary cards)'
);

// Check card deltas never modify more than 2 metrics per branch
for (const card of CARDS) {
  for (const side of ['left', 'right']) {
    const branch = card[side];
    assert.ok(branch.label && branch.feedback && branch.explanation, `Incomplete ${side} branch on card ${card.code}`);
    const nonZeroKeys = Object.keys(branch.deltas).filter((k) => branch.deltas[k] !== 0);
    assert.ok(
      nonZeroKeys.length >= 1 && nonZeroKeys.length <= 2,
      `Card ${card.code} ${side} must change 1 or 2 metrics, got ${nonZeroKeys.length}`
    );
  }
}

// 2. Exhaustive verification of all 2^10 = 1,024 Left/Right sequences
const expectedChars = new Set(['muc-tieu', 'so-huu', 'quan-ly', 'phan-phoi', 'gan-ket']);
const minScores = { T: Infinity, C: Infinity, N: Infinity, D: Infinity };
const maxScores = { T: -Infinity, C: -Infinity, N: -Infinity, D: -Infinity };
let allLeftResult = null;
let allRightResult = null;

for (let mask = 0; mask < 1024; mask += 1) {
  const choices = [];
  let running = { T: INITIAL_SCORE, C: INITIAL_SCORE, N: INITIAL_SCORE, D: INITIAL_SCORE };

  for (let i = 0; i < 10; i += 1) {
    const side = (mask & (1 << i)) === 0 ? 'left' : 'right';
    choices.push(side);
    running = applyChoiceToState(running, CARDS[i], side);

    for (const k of ['T', 'C', 'N', 'D']) {
      assert.ok(
        running[k] >= 0 && running[k] <= 100,
        `Out of bounds score ${k}=${running[k]} at step ${i + 1} for mask=${mask}`
      );
      if (running[k] < minScores[k]) minScores[k] = running[k];
      if (running[k] > maxScores[k]) maxScores[k] = running[k];
    }
  }

  const computed = computeStateFromChoices(choices, CARDS, METRICS);
  assert.deepEqual(computed.scores, running, `Mismatch between incremental and recomputed scores at mask=${mask}`);
  assert.equal(computed.unlockedCharacteristics.length, 5, `Must unlock 5 characteristics at mask=${mask}`);
  for (const id of expectedChars) {
    assert.ok(computed.unlockedCharacteristics.includes(id), `Missing characteristic ${id} at mask=${mask}`);
  }

  if (mask === 0) allLeftResult = computed.scores;
  if (mask === 1023) allRightResult = computed.scores;
}

// 3. Benchmark checks from plan.md: 82 / 53 / 30 / 50 (all left) and 57 / 60 / 43 / 68 (all right)
assert.deepEqual(
  allLeftResult,
  { T: 82, C: 53, N: 30, D: 50 },
  `All-left benchmark mismatch: ${JSON.stringify(allLeftResult)}`
);
assert.deepEqual(
  allRightResult,
  { T: 57, C: 60, N: 43, D: 68 },
  `All-right benchmark mismatch: ${JSON.stringify(allRightResult)}`
);

// 4. Verify save/reload consistency during feedback phase (must not double-count)
const midGameChoices = ['left', 'right', 'left', 'left', 'right', 'right', 'left'];
const savedFeedback = sanitizeSavedState(
  {
    version: STORAGE_VERSION,
    screen: 'play',
    phase: 'feedback',
    choices: midGameChoices
  },
  CARDS.length
);
assert.ok(savedFeedback, 'Valid feedback save should pass sanitization');
assert.equal(savedFeedback.phase, 'feedback');
const beforeReload = computeStateFromChoices(midGameChoices, CARDS, METRICS);
const afterReload = computeStateFromChoices(savedFeedback.choices, CARDS, METRICS);
assert.deepEqual(beforeReload, afterReload, 'Reloading during feedback must produce identical state');

// Verify invalid / corrupted saves are rejected cleanly
assert.equal(sanitizeSavedState({ version: 999, choices: [] }, 10), null);
assert.equal(sanitizeSavedState({ version: STORAGE_VERSION, choices: ['up'] }, 10), null);

// Verify card 7 differs between left & right (for 1-minute wrap-up comparison)
const leftPlay = ['left', 'left', 'left', 'left', 'left', 'left', 'left', 'left', 'left', 'left'];
const rightOnCard7 = ['left', 'left', 'left', 'left', 'left', 'left', 'right', 'left', 'left', 'left'];
const sLeft7 = computeStateFromChoices(leftPlay, CARDS, METRICS).scores;
const sRight7 = computeStateFromChoices(rightOnCard7, CARDS, METRICS).scores;
assert.notDeepEqual(sLeft7, sRight7, 'Different Card 7 choices must produce distinct final states');

console.log('PASS: Verified 1,024 Left/Right sequences, UI markup invariants, OG assets, and state persistence.');
console.log('Score ranges across all 1,024 paths:', { minScores, maxScores });
console.log('All-Left  (T/C/N/D):', allLeftResult);
console.log('All-Right (T/C/N/D):', allRightResult);
