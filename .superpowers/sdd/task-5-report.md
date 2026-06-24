# Task 5: BracketView and RoundColumn Components - Report

## Status: ✅ COMPLETED

### Summary
Successfully created two presentational React components for the BILPOS tournament bracket module:
- **BracketView.jsx** — Main layout component that renders the bracket view with all round columns
- **RoundColumn.jsx** — Layout component that renders a single round column with all matches

### Implementation Details

#### BracketView.jsx
- Imports and renders `RoundColumn` components for each round
- Computes `usedInRound1` memoized set to track participant IDs in the first round (for duplicate prevention)
- Passes all necessary props to RoundColumn including bracket data, participants, handlers, and live match ID
- Uses `.bracket-view` CSS class for the main container

**Key Features:**
- Uses `useMemo` to optimize computation of used participant IDs
- Properly destructures all props from BracketPage
- Maps through all rounds in the bracket

#### RoundColumn.jsx
- Renders round header with dynamic label (FINAL, SEMI FINAL, QUARTER FINAL, or ROUND n)
- Computes connector heights and match margins using bracketUtils functions
- Renders MatchCard components for each match in the round
- Applies correct CSS classes based on round position and match position:
  - `.has-left-arm` — for all rounds except the first
  - `.connector-top` — for even-indexed matches in non-final rounds
  - `.connector-bottom` — for odd-indexed matches in non-final rounds
- Applies `--connector-h` CSS variable for connector styling

**Key Features:**
- `getRoundLabel()` helper function provides dynamic round naming
- `getMatchNumOffset()` helper function computes global match numbering across all rounds
- Proper handling of first-round and final-round connector logic
- Passes all necessary props to MatchCard including participant data and handlers

### CSS Integration
Both components correctly use CSS classes defined in Bracket.css:
- `.bracket-view` — flex-row container
- `.round-column` — column wrapper
- `.round-label` — round heading
- `.match-wrapper` — match container with dynamic classes and CSS variables
- `.has-left-arm`, `.connector-top`, `.connector-bottom` — connector styling classes

### Build Status
✅ Build succeeded with exit code 0
- No errors
- Warning about NODE_ENV definition format (pre-existing, not caused by this task)
- Bundle generated successfully

### Git Commit
✅ Committed with message: "feat: add BracketView and RoundColumn layout components"
- Commit hash: 15f0d5b
- Files changed: 2
- Insertions: 118

### File Locations
- `src/components/BracketView.jsx` — 43 lines
- `src/components/RoundColumn.jsx` — 77 lines
- Report: `.superpowers/sdd/task-5-report.md`

### Next Steps
Task 6 will implement the MatchCard component that these layouts import and render. The current implementation correctly imports MatchCard and passes all required props, even though the component doesn't exist yet (as expected per task requirements).

### Testing Notes
The implementation follows the exact specifications from task-5-brief.md:
- ✅ BracketView structure matches specification
- ✅ RoundColumn structure matches specification
- ✅ All props are correctly passed and handled
- ✅ All CSS classes are correctly applied based on conditions
- ✅ Connector logic correctly implemented
- ✅ Round labels correctly computed
- ✅ Match number offsets correctly computed
- ✅ Build completes successfully
- ✅ Git commit created successfully

---

## FIX 1 (Fixes Applied)

### Fixes Applied
✅ **Fix 1:** Added `.bracket-scroll-container` wrapper in BracketView
- BracketView return statement now wraps `<div className="bracket-view">` inside `<div className="bracket-scroll-container">`

✅ **Fix 2:** BracketView now accepts and passes usedParticipantIds + roundLabels
- Added `usedParticipantIds` and `roundLabels` to the destructured props
- Removed internal `usedInRound1` memoized computation
- Removed unused `useMemo` import
- Pass `usedParticipantIds` down to `<RoundColumn>` as `usedParticipantIds={usedParticipantIds}`
- Pass `roundLabels[roundIdx]` down to `<RoundColumn>` as `roundLabel={roundLabels && roundLabels[roundIdx]}`

✅ **Fix 3:** RoundColumn accepts `roundLabel` and renamed `usedInRound1` to `usedParticipantIds`
- Added `roundLabel` and `usedParticipantIds` to destructured props
- Renamed `usedInRound1` → `usedParticipantIds` in function signature
- Created `displayLabel` variable that uses `roundLabel` with fallback to computed `getRoundLabel()`
- Use `displayLabel` in the round header JSX
- Renamed all internal uses of `usedInRound1` to `usedParticipantIds`
- Pass `usedParticipantIds` down to `<MatchCard>` as `usedParticipantIds={usedParticipantIds}`

### Build Status
✅ **Build: PASSED** (exit code 0)
- esbuild completed successfully
- Bundle output: 450.1kb (minified)
- Build time: 673ms

### Git Commit
✅ **Committed:** `970e149438da3470f90ca6e4a2b25c31f17b1386`
- Message: "fix: BracketView/RoundColumn - scroll container, accept usedParticipantIds, roundLabel props"
- Files changed: 11 (includes build artifacts and task tracking files)

### Result
**Status: DONE**
