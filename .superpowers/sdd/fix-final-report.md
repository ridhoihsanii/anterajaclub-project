# Fix Final Report — BILPOS Tournament Bracket Module

## Changes Made

### Fix 1 — Remove double gap in `.round-column` (`src/components/Bracket.css`)

**Problem:** `.round-column` had `gap: 8px` which was redundant because `computeMatchMargins` already applies `marginTop` for the 8px spacing between cards, resulting in 16px total gaps and misaligned connector lines.

**Change:** Set `gap: 0` on `.round-column` (with a comment explaining spacing is handled by `computeMatchMargins marginTop`). All other `.round-column` properties left unchanged.

---

### Fix 2 — Add `.participant-name` CSS rule (`src/components/Bracket.css`)

**Problem:** `ParticipantSlot.jsx` renders `<span className="participant-name">` for round 2+ read-only display, but no `.participant-name` CSS rule existed, causing overflow/truncation issues.

**Change:** Added the following rule immediately after `.participant-label.bye`:

```css
.participant-name {
  flex: 1;
  font-size: 0.8rem;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

The `.participant-label` rule and `ParticipantSlot.jsx` were not modified.

---

### Fix 3 — Enrich winner with full participant data before advancing (`src/components/BracketPage.jsx`)

**Problem:** `BilposTournament.generateBracket` strips `hcCustom` from participants. When a match winner is advanced to the next round, the winner object was taken from `match.winner` (which lacks `hcCustom`), so custom HC values displayed as the literal text "custom" in later rounds.

**Change:** In `handleScoreChange`, before calling `advanceWinner`, the winner is now enriched by looking up the full participant record from `prev.participants`:

```js
var fullWinner = prev.participants.find(function(p) { return String(p.id) === String(newWinner.id); }) || newWinner;
window.BilposTournament.advanceWinner(newBracket, roundIdx, matchIdx, fullWinner);
```

`prev.participants` was already available in scope (returned in every `setState` update).

---

## Build Result

```
npm run build  →  exit code 0
assets/js/bracket.bundle.js  147.5kb  (done in 144ms)
```

## Unit Test Result

```
node --test tests/bracket-react.test.js  →  exit code 0
pass 21 / 21, fail 0
```

## Commit

**SHA:** `bf72d7b`  
**Message:** `fix: remove double gap, add participant-name CSS, enrich winner with hcCustom`  
**Files changed:** `src/components/Bracket.css`, `src/components/BracketPage.jsx`
