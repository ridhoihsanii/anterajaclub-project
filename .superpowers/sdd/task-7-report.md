# Task 7 Report: entry.jsx Update + Playwright E2E Tests

## Status: DONE

## Commit
`800216c` — feat: complete tournament bracket module with React, connectors, LIVE, persistence

---

## Work Performed

### Step 1: Replaced `src/entry.jsx`
Replaced old `Bracket` component mount with `BracketPage`. Added nav click listener that dispatches `bilpos:bracket-activated` event on `window`.

### Step 2: Created `tests/bracket-react.spec.js`
13 Playwright E2E tests as specified in the task brief.

### Step 3: Bugs fixed along the way

**Bug 1 — `tournament.js` missing from `index.html`**
`BracketPage.jsx` calls `window.BilposTournament.generateBracket()`. This global comes from `assets/js/tournament.js`, which was never loaded by `index.html`. Without it, the code fell back to `{ rounds: [], size }`, triggering the empty state and rendering nothing.
- Fix: Added `<script src="assets/js/tournament.js"></script>` to `index.html` before `bracket.bundle.js`.

**Bug 2 — `process.env.NODE_ENV` define broken on Windows**
The npm build script used `--define:process.env.NODE_ENV="production"`. On Windows cmd.exe, the outer quotes are stripped, so esbuild received `production` as an unquoted identifier. At runtime, `production is not defined` ReferenceError crashed the entire bundle before React could mount.
- Fix: Changed package.json build script to `--define:process.env.NODE_ENV=\\\"production\\\"` (Windows-compatible escaping).
- Result: Bundle shrank from 454 KB to 147 KB (proper tree-shaking in production mode).

**Bug 3 — `MatchCard.jsx` props mismatch + wrong CSS class**
`RoundColumn.jsx` passed `isLive={match.id === liveMatchId}` as a boolean prop. `MatchCard.jsx` expected `liveMatchId` (string) and recalculated `isLive` itself — so `liveMatchId` was always `undefined`, making `isLive` always `false`. Additionally, the component used class `is-live` but tests expect `.match-card.live`.
- Fix: Updated `MatchCard.jsx` to accept `isLive` directly as a boolean prop, removed internal recalculation. Changed class from `is-live` to `live`.

**Test data fix — participants needed `drawingNumber` not `slot`**
`BilposTournament.generateBracket()` uses `drawingNumber` to assign participants to slots. The initial test helper used `slot: i` instead of `drawingNumber: i`, so all participants mapped to BYE, disabling dropdowns and LIVE buttons.
- Fix: Updated `setupBracket()` in the spec to use `drawingNumber: i`.

---

## Test Results

### Playwright E2E — `tests/bracket-react.spec.js`

```
Running 13 tests using 1 worker

  ✓   1  React Bracket Module › Bracket nav item is visible (1.6s)
  ✓   2  React Bracket Module › bracket section becomes active after clicking nav (2.1s)
  ✓   3  React Bracket Module › renders bracket-view for 16 participants (2.4s)
  ✓   4  React Bracket Module › renders 4 round columns for 16 participants (2.2s)
  ✓   5  React Bracket Module › first round label is ROUND 1 and last is FINAL (2.3s)
  ✓   6  React Bracket Module › round 1 match cards contain participant dropdowns (2.0s)
  ✓   7  React Bracket Module › participant dropdown options include HC label (2.4s)
  ✓   8  React Bracket Module › LIVE button marks match card with live class (2.9s)
  ✓   9  React Bracket Module › only one match is live at a time (4.7s)
  ✓  10  React Bracket Module › clicking active LIVE button deactivates it (2.5s)
  ✓  11  React Bracket Module › entering scores shows WIN/LOSE badges (2.4s)
  ✓  12  React Bracket Module › bracket state persists after page reload (4.0s)
  ✓  13  React Bracket Module › renders 7 round columns for 128 participants (2.9s)

  13 passed (37.3s)
```

### Unit Tests

| Test File | Result |
|---|---|
| `tests/bracket.test.js` | 5 pass, 2 fail (pre-existing failures on old `bracket.js`, unrelated to this task) |
| `tests/tournament.test.js` | 1 pass |
| `tests/bracket-react.test.js` | 21 pass |

The 2 pre-existing failures in `bracket.test.js` were confirmed to exist before any changes in this task (verified by `git stash` + re-run). They test SVG connector dimensions in the old `assets/js/bracket.js` module which was not modified.

### Build Result

```
> esbuild src/entry.jsx --bundle --outfile=assets/js/bracket.bundle.js ...

  assets\js\bracket.bundle.js      147.4kb
  assets\js\bracket.bundle.js.map  372.0kb

Done in 265ms
```

No warnings. Bundle size reduced from 454KB to 147KB (correct production mode tree-shaking).

---

## Files Changed

| File | Change |
|---|---|
| `src/entry.jsx` | Mount `BracketPage`, dispatch `bilpos:bracket-activated` on bracket nav click |
| `tests/bracket-react.spec.js` | New file: 13 Playwright E2E tests |
| `index.html` | Added `<script src="assets/js/tournament.js">` |
| `package.json` | Fixed `--define:process.env.NODE_ENV` Windows quoting |
| `src/components/MatchCard.jsx` | Accept `isLive` boolean prop directly; use `live` CSS class |
| `assets/js/bracket.bundle.js` | Rebuilt |
| `assets/js/bracket.bundle.js.map` | Rebuilt |

---

## FIX 1 (after review)
- Restored `liveMatchId` prop to `MatchCard`, derive `isLive` internally via `const isLive = match.id === liveMatchId`
- Restored `is-live` CSS class (not `live`)
- Fixed `RoundColumn` to pass `liveMatchId={liveMatchId}` to `MatchCard` (not `isLive`)
- Updated existing tests that referenced `.match-card.live` → `.match-card.is-live`
- Added empty state test (sets `size: 1` in localStorage to trigger `rounds.length === 0`)
- Added winner advancement test (enters scores 7/3 in first match, asserts Player 1 in Round 2)
- Build: passed (exit 0, 147.4kb)
- Tests: 15/15 passing
- Commit: f2e0abc
