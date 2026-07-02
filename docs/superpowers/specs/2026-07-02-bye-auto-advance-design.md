# BYE Auto-Advance in Round 1 — Design Spec
_Date: 2026-07-02_

## Problem

For a 96-player tournament using a 128-slot bracket (byeCount = 32), the current system
fills R0 M0–M47 with real players (2 per match) and leaves M48–M63 completely empty
(null, null). These empty matches propagate upward through R1–R5, causing:

- Match #126 (R5 M1) to render at 5134px — far below all real content.
- The second semi-final to have no real players, because the entire right half of the
  bracket flows from the empty M48–M63 zone.

**Requirement:** BYE advancement must only happen in Round 1 (R0). From R1 onwards,
every match must contain real players only.

## Approach: Auto-advance BYE in handleSelectParticipant

Keep the existing manual dropdown UX for R0 slot assignment.
Add auto-advance logic so that whenever a user fills one slot of an R0 match and the
other slot remains null, the filled player automatically advances to R1 as a BYE winner.

## Behavior Table

| Match state after participant change | System action |
|---|---|
| P1 filled, P2 null | P1 wins by BYE — advance P1 to R1 |
| P2 filled, P1 null | P2 wins by BYE — advance P2 to R1 |
| Both P1 and P2 filled | Real match — clear any previous BYE advance |
| Player removed from single-player match | Cascade-clear the advance from R1 |
| Both slots null | No action — match is unplayed |

## What Users Must Do for 96-Player Tournament

- Fill **32 R0 matches** with **1 player each** → these 32 players receive BYEs.
- Fill **32 R0 matches** with **2 players each** → these 64 players compete in R0.
- Leave the remaining **0 matches** empty (slot count: 32×1 + 32×2 = 96 players ✓).

After assignment, R1 has exactly 64 real players and no BYE slots exist beyond R0.

## Files Changed

| File | Change |
|---|---|
| `src/components/BracketPage.jsx` | Add BYE auto-advance logic in `handleSelectParticipant` |

No changes to `tournament.js`, `bracketUtils.js`, or CSS files.

## Edge Cases

- **User adds P2 to a BYE match**: `cascadeClearWinnerMut` removes P1's advance from R1;
  match becomes real. This reuses the existing cascade-clear that already handles score changes.
- **User removes P1 from a BYE match**: cascade-clear removes P1 from R1; match becomes empty.
- **Both slots null**: no winner, no advance — match is simply not played.
- **`prevWinner` handling**: always cascade-clear before re-evaluating the new state,
  so switching between BYE and real match never leaves stale winners in R1+.
