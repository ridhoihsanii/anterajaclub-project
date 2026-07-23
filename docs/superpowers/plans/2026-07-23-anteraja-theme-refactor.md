# Anteraja Brand Theme Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the Anteraja tournament app's colors, typography, and component visuals to match the real Anteraja corporate brand guide (Magenta/Kuning identity, Baloo 2 typeface), with zero changes to business logic, state, routing, or data.

**Architecture:** Pure CSS/token refactor. `assets/css/style.css` already uses a CSS-custom-property token system (`:root` + `[data-theme="light"]` overrides) — this plan repoints those tokens to brand values and performs mechanical literal-color replacements (hex/rgb triplets) that mirror the token renames, then rebuilds the React bracket bundle and updates the one style-contract test file.

**Tech Stack:** Vanilla CSS custom properties, esbuild (existing `npm run build`), Node's built-in test runner (`node --test`), PowerShell `-replace` for mechanical find/replace.

## Global Constraints

- Do not modify any `.js`/`.jsx` logic, only CSS/HTML style attributes and the two Google Font `<link>` tags. (Spec: "Files Affected")
- Do not touch `assets/js/app.js`, `assets/js/tournament.js`, `assets/js/storage.js`, `assets/js/firebase-sync.js`, `src/components/BracketPage.jsx` logic, `src/entry.jsx`, routing, or any test file other than `tests/style.test.js`. (Spec: "Files Affected")
- Bracket connector lines, win/lose badges, and the live-blink animation stay semantically colored (green=win, red=live/danger) — do not recolor them to brand magenta/kuning. (Spec: "Component Mapping")
- Leave `.superpowers/` and `docs/superpowers/plans/*` (other than this file) and `docs/superpowers/specs/*` (other than the design spec) untouched — they are historical records. (Spec: "Testing / Verification Plan", item 4)
- After every task that edits `assets/css/style.css` or `src/components/Bracket.css`, run the grep verification command given in that task before committing.
- Working directory for all commands: `C:\Users\RabbaniRidhoIhsani\Documents\Documents\Dokumen Pribadi\project ihsan\anterajaclub-project`

---

### Task 1: Rewrite root design tokens in `style.css`

**Files:**
- Modify: `assets/css/style.css:1-42` (the `:root { ... }` block and the `[data-theme="light"] { ... }` block)

**Interfaces:**
- Produces: new CSS custom properties consumed by later tasks — `--anteraja-primary`, `--anteraja-primary-dark`, `--anteraja-secondary`, `--anteraja-pink`, `--anteraja-blue`, `--anteraja-maroon`, `--anteraja-charcoal`, `--shadow-brand`, `--radius-blob`. Existing property *names* `--anteraja-black`, `--anteraja-dark`, `--anteraja-surface`, `--anteraja-surface-2`, `--anteraja-border`, `--anteraja-border-active`, `--bg`, `--bg-alt`, `--success`, `--danger`, `--warning`, `--info` are kept but get new values.

- [ ] **Step 1: View current token block to confirm exact text to replace**

Run: `Get-Content assets\css\style.css -TotalCount 42`

Expected: prints the current `:root { ... }` and `[data-theme="light"] { ... }` blocks exactly as shown below (this is the "before" state we're about to replace):

```css
:root {
  --anteraja-yellow: #FACC15;
  --anteraja-gold: #EAB308;
  --anteraja-black: #0A0A0A;
  --anteraja-dark: #111111;
  --anteraja-surface: #1A1A1A;
  --anteraja-surface-2: #222222;
  --anteraja-border: rgba(250,204,21,0.15);
  --anteraja-border-active: rgba(250,204,21,0.45);
  --text-primary: #FFFFFF;
  --text-secondary: #A3A3A3;
  --text-muted: #525252;
  --success: #22C55E;
  --danger: #EF4444;
  --warning: #F59E0B;
  --info: #3B82F6;
  --sidebar-width: 260px;
  --header-height: 64px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --shadow-sm: 0 2px 8px rgba(0,0,0,0.4);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.5);
  --shadow-lg: 0 8px 32px rgba(0,0,0,0.6);
  --shadow-yellow: 0 0 20px rgba(250,204,21,0.2);
  --transition: all 0.25s cubic-bezier(0.4,0,0.2,1);

  /* Theme mapping used by data-theme attribute */
  --bg: #000;
  --bg-alt: #111111;
  --surface: var(--anteraja-surface);
  --surface-2: var(--anteraja-surface-2);
  --text: var(--text-primary);
  --accent: var(--anteraja-yellow);
}

[data-theme="light"] {
  --bg: #f8fafc;
  --bg-alt: #f1f5f9;
  --surface: #ffffff;
  --surface-2: #f8fafc;
  --text: #0f172a;
  --text-secondary: #475569;
  --anteraja-border: #e2e8f0;
  --accent: var(--anteraja-yellow);
}
```

- [ ] **Step 2: Replace the block with the new Anteraja brand tokens**

Use the `edit` tool (or equivalent) to replace the exact text block from Step 1 with:

```css
:root {
  /* Brand constants (from Anteraja Brand Guide, Dec 2025) */
  --anteraja-primary: #ED0677;        /* Magenta Sigap */
  --anteraja-primary-dark: #C10561;   /* darker magenta for gradients/hover */
  --anteraja-secondary: #FFCB05;      /* Kuning Ramah */
  --anteraja-pink: #F6AABF;           /* Pink Aman */
  --anteraja-blue: #496AAA;           /* Biru Terpercaya */
  --anteraja-maroon: #841945;         /* Maroon Amanah */
  --anteraja-charcoal: #3B2C2F;       /* Hitam Integritas */

  /* Dark-mode (default) surfaces — warm near-black derived from Hitam Integritas */
  --anteraja-black: #1A1214;
  --anteraja-dark: #241A1D;
  --anteraja-surface: #2A1F22;
  --anteraja-surface-2: #34262A;
  --anteraja-border: rgba(237,6,119,0.18);
  --anteraja-border-active: rgba(237,6,119,0.5);
  --text-primary: #F5EDEF;
  --text-secondary: #C9B8BC;
  --text-muted: #8A7378;
  --success: #22C55E;
  --danger: #EF4444;
  --warning: #FFCB05;
  --info: #496AAA;
  --sidebar-width: 260px;
  --header-height: 64px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-blob: 42% 58% 55% 45% / 48% 42% 58% 52%;
  --shadow-sm: 0 2px 8px rgba(0,0,0,0.4);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.5);
  --shadow-lg: 0 8px 32px rgba(0,0,0,0.6);
  --shadow-brand: 0 0 20px rgba(237,6,119,0.25);
  --transition: all 0.25s cubic-bezier(0.4,0,0.2,1);

  /* Theme mapping used by data-theme attribute */
  --bg: #1A1214;
  --bg-alt: #241A1D;
  --surface: var(--anteraja-surface);
  --surface-2: var(--anteraja-surface-2);
  --text: var(--text-primary);
  --accent: var(--anteraja-primary);
}

[data-theme="light"] {
  --bg: #FFFAFC;
  --bg-alt: #FFF3F7;
  --surface: #ffffff;
  --surface-2: #FFF8FB;
  --text: var(--anteraja-charcoal);
  --text-secondary: #6b5a5e;
  --text-muted: #9c8a8e;
  --anteraja-border: #f3d9e4;
  --anteraja-border-active: rgba(237,6,119,0.4);
  --accent: var(--anteraja-primary);
}
```

- [ ] **Step 3: Verify the old token names for yellow/gold/shadow-yellow are gone from the root block**

Run: `Select-String -Path assets\css\style.css -Pattern '--anteraja-yellow:|--anteraja-gold:|--shadow-yellow:' | Select-Object -First 5`

Expected: no output (these definitions no longer exist — later tasks still reference the *usages* of `--anteraja-yellow`/`--anteraja-gold`/`--shadow-yellow` elsewhere in the file, which Task 2 fixes).

- [ ] **Step 4: Commit**

```bash
git add assets/css/style.css
git commit -m "style: rewrite root design tokens with Anteraja brand colors"
```

---

### Task 2: Replace all token-name usages of yellow/gold/shadow-yellow in `style.css`

**Files:**
- Modify: `assets/css/style.css` (all lines using `var(--anteraja-yellow)`, `var(--anteraja-gold)`, `var(--shadow-yellow)` — 44, 6, and 2 occurrences respectively as of this plan's writing)

**Interfaces:**
- Consumes: `--anteraja-primary`, `--anteraja-primary-dark`, `--shadow-brand` from Task 1.
- Produces: a `style.css` with zero remaining references to the old token names (verified by grep in Step 3).

- [ ] **Step 1: Count current usages (baseline)**

Run:
```powershell
cd "C:\Users\RabbaniRidhoIhsani\Documents\Documents\Dokumen Pribadi\project ihsan\anterajaclub-project"
(Select-String -Path assets\css\style.css -Pattern '--anteraja-yellow\)').Count
(Select-String -Path assets\css\style.css -Pattern '--anteraja-gold\)').Count
(Select-String -Path assets\css\style.css -Pattern '--shadow-yellow\)').Count
```
Expected: `44`, `6`, `2` (confirms the baseline this task must reduce to 0).

- [ ] **Step 2: Run the scripted replace**

Run:
```powershell
cd "C:\Users\RabbaniRidhoIhsani\Documents\Documents\Dokumen Pribadi\project ihsan\anterajaclub-project"
$path = 'assets\css\style.css'
$content = Get-Content -Raw -LiteralPath $path
$content = $content -replace '--anteraja-yellow\)', '--anteraja-primary)'
$content = $content -replace '--anteraja-gold\)', '--anteraja-primary-dark)'
$content = $content -replace '--shadow-yellow\)', '--shadow-brand)'
Set-Content -LiteralPath $path -Value $content -NoNewline
```

- [ ] **Step 3: Verify zero remaining usages**

Run:
```powershell
(Select-String -Path assets\css\style.css -Pattern '--anteraja-yellow\)|--anteraja-gold\)|--shadow-yellow\)').Count
```
Expected: `0`

- [ ] **Step 4: Commit**

```bash
git add assets/css/style.css
git commit -m "style: repoint yellow/gold/shadow-yellow var usages to Anteraja primary tokens"
```

---

### Task 3: Replace literal hex/RGB color values in `style.css`

**Files:**
- Modify: `assets/css/style.css` (literal `#FACC15`, `#EAB308`, `rgba(250,204,21,*)`, `rgba(234,179,8,*)` occurrences not covered by Task 2's variable-name replace)

**Interfaces:**
- Consumes: brand hex values from the design spec (`#ED0677` primary, `#C10561` primary-dark).
- Produces: a `style.css` with zero remaining old-yellow literal color values (verified in Step 3).

- [ ] **Step 1: Count current literal usages (baseline)**

Run:
```powershell
cd "C:\Users\RabbaniRidhoIhsani\Documents\Documents\Dokumen Pribadi\project ihsan\anterajaclub-project"
(Select-String -Path assets\css\style.css -Pattern '250,\s*204,\s*21').Count   # expect 54
(Select-String -Path assets\css\style.css -Pattern 'FACC15').Count            # expect 1
(Select-String -Path assets\css\style.css -Pattern 'EAB308').Count            # expect 1
(Select-String -Path assets\css\style.css -Pattern '234,\s*179,\s*8').Count   # expect 6
```

- [ ] **Step 2: Run the scripted replace**

Run:
```powershell
cd "C:\Users\RabbaniRidhoIhsani\Documents\Documents\Dokumen Pribadi\project ihsan\anterajaclub-project"
$path = 'assets\css\style.css'
$content = Get-Content -Raw -LiteralPath $path
$content = $content -replace '250,\s*204,\s*21', '237,6,119'
$content = $content -creplace 'FACC15', 'ED0677'
$content = $content -creplace 'EAB308', 'C10561'
$content = $content -replace '234,\s*179,\s*8', '193,5,97'
Set-Content -LiteralPath $path -Value $content -NoNewline
```

- [ ] **Step 3: Verify zero remaining old literal colors**

Run:
```powershell
(Select-String -Path assets\css\style.css -Pattern '250,\s*204,\s*21|FACC15|EAB308|234,\s*179,\s*8').Count
```
Expected: `0`

- [ ] **Step 4: Commit**

```bash
git add assets/css/style.css
git commit -m "style: replace literal yellow/gold RGB and hex values with Anteraja magenta"
```

---

### Task 4: Fix text-contrast on magenta-background elements

Task 2/3's mechanical replace turns `.btn-anteraja-primary`, `.drawing-badge`, and `.wheel-spin-btn` into a magenta background — but their `color` still resolves to the old "black text on yellow" value (now `var(--anteraja-primary-dark)`-derived or the literal `--anteraja-black`), which is unreadable on magenta. This task fixes text color on those three elements to white, and adds the empty-state "blob" decorative treatment from the spec.

**Files:**
- Modify: `assets/css/style.css` — `.btn-anteraja-primary` rule (originally around line 474), `.drawing-badge` rule (originally around line 564), `.wheel-spin-btn` rule (single-line, originally around line 1063), `.empty-icon` rule (originally around line 1311)

**Interfaces:**
- Consumes: `--anteraja-pink`, `--radius-blob` from Task 1.

- [ ] **Step 1: Confirm current (post Task 2/3) text colors on the three magenta-background elements**

Run:
```powershell
cd "C:\Users\RabbaniRidhoIhsani\Documents\Documents\Dokumen Pribadi\project ihsan\anterajaclub-project"
Select-String -Path assets\css\style.css -Pattern 'color: var\(--anteraja-black\);' -Context 2,0
```
Expected: three matches — inside `.btn-anteraja-primary`, `.drawing-badge`, and the `.wheel-spin-btn` one-liner.

- [ ] **Step 2: Replace `color: var(--anteraja-black);` with `color: #FFFFFF;` in those three rules**

Run:
```powershell
cd "C:\Users\RabbaniRidhoIhsani\Documents\Documents\Dokumen Pribadi\project ihsan\anterajaclub-project"
$path = 'assets\css\style.css'
$content = Get-Content -Raw -LiteralPath $path
$content = $content -replace 'color: var\(--anteraja-black\);', 'color: #FFFFFF;'
$content = $content -replace 'color:var\(--anteraja-black\);', 'color:#FFFFFF;'
Set-Content -LiteralPath $path -Value $content -NoNewline
```

- [ ] **Step 3: Verify no rule still sets `var(--anteraja-black)` as a `color:` value**

Run:
```powershell
Select-String -Path assets\css\style.css -Pattern 'color:\s*var\(--anteraja-black\)'
```
Expected: no output.

- [ ] **Step 4: Add the blob-shaped empty-state treatment**

Using the `edit` tool, find this existing rule in `assets/css/style.css`:

```css
.empty-icon {
  font-size: 3rem;
  margin-bottom: 16px;
  opacity: 0.6;
  filter: grayscale(0.3);
}
```

Replace it with:

```css
.empty-icon {
  font-size: 2.4rem;
  width: 84px;
  height: 84px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  color: var(--anteraja-primary);
  background: var(--anteraja-pink);
  border-radius: var(--radius-blob);
  opacity: 0.9;
}
```

- [ ] **Step 5: Run the full grep verification for this task**

Run:
```powershell
(Select-String -Path assets\css\style.css -Pattern 'var\(--anteraja-black\)').Count
```
Expected: `0` (the variable is no longer referenced anywhere as of this task; it remains *defined* in `:root` from Task 1 for the `--bg`/`--bg-alt` mapping only — re-check: `--bg: #1A1214;` no longer uses the var either, so if this returns `0` that's correct and expected).

- [ ] **Step 6: Commit**

```bash
git add assets/css/style.css
git commit -m "style: fix text contrast on magenta buttons/badges, add blob empty-state icon"
```

---

### Task 5: Swap typeface from Poppins to Baloo 2 in `style.css`

**Files:**
- Modify: `assets/css/style.css` (12 occurrences of `'Poppins', sans-serif`)

**Interfaces:**
- Produces: every `font-family` declaration in `style.css` uses `'Baloo 2', sans-serif`.

- [ ] **Step 1: Count current occurrences (baseline)**

Run: `(Select-String -Path assets\css\style.css -Pattern "Poppins").Count`
Expected: `12`

- [ ] **Step 2: Run the replace**

Run:
```powershell
cd "C:\Users\RabbaniRidhoIhsani\Documents\Documents\Dokumen Pribadi\project ihsan\anterajaclub-project"
$path = 'assets\css\style.css'
$content = Get-Content -Raw -LiteralPath $path
$content = $content -replace "'Poppins', sans-serif", "'Baloo 2', sans-serif"
Set-Content -LiteralPath $path -Value $content -NoNewline
```

- [ ] **Step 3: Verify zero remaining Poppins references**

Run: `(Select-String -Path assets\css\style.css -Pattern "Poppins").Count`
Expected: `0`

- [ ] **Step 4: Commit**

```bash
git add assets/css/style.css
git commit -m "style: swap typeface from Poppins to Baloo 2"
```

---

### Task 6: Update Google Fonts links and inline styles in `index.html`

**Files:**
- Modify: `index.html:11` (Google Fonts `<link>`), `index.html:179` (inline `style="..."` on `#btn-preview-bracket`)

- [ ] **Step 1: Replace the Google Fonts link**

Find:
```html
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
```

Replace with:
```html
  <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

- [ ] **Step 2: Replace the hardcoded yellow inline style on the preview button**

Find (single line in `index.html`, the `#btn-preview-bracket` button):
```html
          <button id="btn-preview-bracket" title="Buka preview fullscreen yang bisa dibagikan" style="display:flex;align-items:center;gap:7px;padding:8px 16px;border-radius:8px;border:1.5px solid rgba(250,204,21,0.4);background:rgba(250,204,21,0.07);color:#FACC15;font-family:inherit;font-size:12px;font-weight:600;cursor:pointer;letter-spacing:.5px;transition:background .15s,border-color .15s;">
```

Replace with:
```html
          <button id="btn-preview-bracket" title="Buka preview fullscreen yang bisa dibagikan" style="display:flex;align-items:center;gap:7px;padding:8px 16px;border-radius:8px;border:1.5px solid rgba(237,6,119,0.4);background:rgba(237,6,119,0.07);color:#ED0677;font-family:inherit;font-size:12px;font-weight:600;cursor:pointer;letter-spacing:.5px;transition:background .15s,border-color .15s;">
```

- [ ] **Step 3: Verify no remaining Poppins/yellow literals in `index.html`**

Run: `Select-String -Path index.html -Pattern 'Poppins|FACC15|250,\s*204,\s*21'`
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "style: update index.html font link and preview button to Anteraja brand"
```

---

### Task 7: Update `src/components/Bracket.css` literal colors

**Files:**
- Modify: `src/components/Bracket.css` (6 occurrences of `250, 204, 21` / `#FACC15` used by `.round-label`; light-theme override block at the bottom of the file)

**Interfaces:**
- Consumes: brand hex `#ED0677` / rgb `237, 6, 119` (note: this file uses a space after each comma, unlike `style.css`).
- Constraint: do NOT touch `.match-wrapper` connector colors (`rgba(100, 140, 180, 0.9)`), `.live-btn`/`.badge.win`/`.badge.lose`/`liveBlink` colors, or `.match-slot.winner-slot`/`.loser-slot` — those are semantic and must stay as-is per the Global Constraints.

- [ ] **Step 1: Confirm the exact matches to change (baseline)**

Run: `Select-String -Path src\components\Bracket.css -Pattern '250,\s*204,\s*21|FACC15'`

Expected output shows exactly these lines:
- `.round-label { ... color: #FACC15; ... }`
- `.round-label { ... background: rgba(250, 204, 21, 0.07); ... }`
- `.match-card:hover { border-color: rgba(250, 204, 21, 0.2); }`
- `[data-theme='light'] .round-label { background: rgba(250, 204, 21, 0.12); }`
- two more inside the same rules (exact count: 6 across `250, 204, 21` + `FACC15`)

- [ ] **Step 2: Run the replace**

Run:
```powershell
cd "C:\Users\RabbaniRidhoIhsani\Documents\Documents\Dokumen Pribadi\project ihsan\anterajaclub-project"
$path = 'src\components\Bracket.css'
$content = Get-Content -Raw -LiteralPath $path
$content = $content -replace '250,\s*204,\s*21', '237, 6, 119'
$content = $content -creplace 'FACC15', 'ED0677'
Set-Content -LiteralPath $path -Value $content -NoNewline
```

- [ ] **Step 3: Verify zero remaining old-yellow references, and that semantic colors are untouched**

Run:
```powershell
(Select-String -Path src\components\Bracket.css -Pattern '250,\s*204,\s*21|FACC15').Count   # expect 0
Select-String -Path src\components\Bracket.css -Pattern 'rgba\(100, 140, 180' | Measure-Object | Select-Object -ExpandProperty Count   # expect 3 (connectors untouched)
Select-String -Path src\components\Bracket.css -Pattern '#22c55e|#ff1744|#ff5252' | Measure-Object | Select-Object -ExpandProperty Count  # expect >= 3 (win/live colors untouched)
```

- [ ] **Step 4: Commit**

```bash
git add src/components/Bracket.css
git commit -m "style: replace literal yellow colors in Bracket.css round-label/hover with Anteraja magenta"
```

---

### Task 8: Rebuild the React bracket bundle

**Files:**
- Regenerate: `assets/js/bracket.bundle.js`, `assets/js/bracket.bundle.js.map`, `assets/js/bracket.bundle.css`, `assets/js/bracket.bundle.css.map` (via `npm run build`, no manual edits)

**Interfaces:**
- Consumes: `src/components/Bracket.css` changes from Task 7 (no JSX/logic changes are expected or allowed in this task).

- [ ] **Step 1: Run the build**

Run: `npm run build`

Expected output ends with:
```
  assets\js\bracket.bundle.js       <size>
  assets\js\bracket.bundle.css      <size>
  assets\js\bracket.bundle.js.map   <size>
  assets\js\bracket.bundle.css.map  <size>

Done in <time>ms
```
with exit code 0 and no error lines.

- [ ] **Step 2: Verify the new bundle contains the brand magenta color and not the old yellow**

Run:
```powershell
(Select-String -Path assets\js\bracket.bundle.css -Pattern 'ED0677').Count   # expect >= 1
(Select-String -Path assets\js\bracket.bundle.css -Pattern 'FACC15|250,\s*204,\s*21').Count   # expect 0
```

- [ ] **Step 3: Commit the regenerated bundle**

```bash
git add assets/js/bracket.bundle.js assets/js/bracket.bundle.js.map assets/js/bracket.bundle.css assets/js/bracket.bundle.css.map
git commit -m "chore: rebuild bracket bundle with Anteraja brand Bracket.css"
```

---

### Task 9: Restyle `preview.html` to the Anteraja brand palette

**Files:**
- Modify: `preview.html` (internal `<style>` block: `--accent` variable and its literal `217,119,6` RGB usages; Google Fonts `<link>`; `font-family: 'Poppins'` declaration)

**Interfaces:**
- Constraint: keep `--green`/`--red`/win/lose semantic colors and the neutral `--bg`/`--surface`/`--border`/`--text`/`--muted` grays untouched — only the accent (amber `#d97706`) becomes Anteraja magenta.

- [ ] **Step 1: Confirm current accent-related lines (baseline)**

Run: `Select-String -Path preview.html -Pattern "accent:\s*#d97706|217,\s*119,\s*6|Poppins"`

Expected: matches for `--accent: #d97706;`, several `rgba(217,119,6,*)` usages, the Google Fonts `<link>`, and `font-family: 'Poppins', sans-serif;`.

- [ ] **Step 2: Run the replace**

Run:
```powershell
cd "C:\Users\RabbaniRidhoIhsani\Documents\Documents\Dokumen Pribadi\project ihsan\anterajaclub-project"
$path = 'preview.html'
$content = Get-Content -Raw -LiteralPath $path
$content = $content -replace '--accent:\s*#d97706;', '--accent:    #ED0677;'
$content = $content -replace '217,\s*119,\s*6', '237,6,119'
$content = $content -creplace '#d97706', '#ED0677'
$content = $content -replace "'Poppins', sans-serif", "'Baloo 2', sans-serif"
$content = $content -replace 'family=Poppins:wght@400;500;600;700', 'family=Baloo+2:wght@400;500;600;700;800'
Set-Content -LiteralPath $path -Value $content -NoNewline
```

- [ ] **Step 3: Verify zero remaining old-accent/font references**

Run:
```powershell
(Select-String -Path preview.html -Pattern 'd97706|217,\s*119,\s*6|Poppins').Count
```
Expected: `0`

- [ ] **Step 4: Verify semantic win/lose colors are untouched**

Run: `Select-String -Path preview.html -Pattern '#16a34a|#dc2626'`
Expected: matches still present (green/red kept).

- [ ] **Step 5: Commit**

```bash
git add preview.html
git commit -m "style: restyle preview.html accent color and font to Anteraja brand"
```

---

### Task 10: Update `tests/style.test.js` to assert the new design tokens

**Files:**
- Modify: `tests/style.test.js:14-21` (the token assertion array in the first test)
- Modify: `tests/style.test.js:53-59` (the token/gradient string assertions in the third test)

**Interfaces:**
- Consumes: the exact new token strings written in Tasks 1–5.

- [ ] **Step 1: Run the test to see it fail against the new CSS**

Run: `node --test tests/style.test.js`

Expected: FAIL — assertion errors referencing `--anteraja-yellow: #FACC15;`, `--anteraja-gold: #EAB308;`, `--anteraja-black: #0A0A0A;`, `--anteraja-surface-2: #222222;`, `--shadow-yellow: 0 0 20px rgba(250,204,21,0.2);`, and the gradient string `linear-gradient(135deg, var(--anteraja-yellow) 0%, var(--anteraja-gold) 100%);` no longer being found.

- [ ] **Step 2: Update the first test's token list**

Find in `tests/style.test.js`:
```javascript
  [
    '--anteraja-yellow: #FACC15;',
    '--anteraja-gold: #EAB308;',
    '--anteraja-black: #0A0A0A;',
    '--anteraja-surface-2: #222222;',
    '--shadow-yellow: 0 0 20px rgba(250,204,21,0.2);',
    '--transition: all 0.25s cubic-bezier(0.4,0,0.2,1);'
  ].forEach((token) => {
```

Replace with:
```javascript
  [
    '--anteraja-primary: #ED0677;',
    '--anteraja-secondary: #FFCB05;',
    '--anteraja-charcoal: #3B2C2F;',
    '--anteraja-surface-2: #34262A;',
    '--shadow-brand: 0 0 20px rgba(237,6,119,0.25);',
    '--transition: all 0.25s cubic-bezier(0.4,0,0.2,1);'
  ].forEach((token) => {
```

- [ ] **Step 3: Update the third test's gradient/shadow assertions**

Find in `tests/style.test.js`:
```javascript
  [
    'backdrop-filter: blur(20px);',
    'background: linear-gradient(135deg, var(--anteraja-yellow) 0%, var(--anteraja-gold) 100%);',
    'box-shadow: var(--shadow-yellow);',
    'position: sticky;',
```

Replace with:
```javascript
  [
    'backdrop-filter: blur(20px);',
    'background: linear-gradient(135deg, var(--anteraja-primary) 0%, var(--anteraja-primary-dark) 100%);',
    'box-shadow: var(--shadow-brand);',
    'position: sticky;',
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/style.test.js`
Expected: PASS — `# pass 3`, `# fail 0`.

- [ ] **Step 5: Commit**

```bash
git add tests/style.test.js
git commit -m "test: update style.test.js token assertions for Anteraja brand refactor"
```

---

### Task 11: Full-suite verification and final cleanup commit

**Files:** none modified unless a leftover reference is found (in which case, fix in the relevant file from Tasks 1–9 and re-run this task's steps).

- [ ] **Step 1: Grep the whole live codebase for any remaining old-yellow tokens/literals**

Run:
```powershell
cd "C:\Users\RabbaniRidhoIhsani\Documents\Documents\Dokumen Pribadi\project ihsan\anterajaclub-project"
Get-ChildItem -Recurse -File -Include *.css,*.html,*.js,*.jsx | Where-Object {
  $_.FullName -notmatch '\\node_modules\\' -and $_.FullName -notmatch '\\\.git\\' -and $_.FullName -notmatch '\\\.superpowers\\' -and $_.FullName -notmatch '\\docs\\'
} | Select-String -Pattern 'FACC15|EAB308|250,\s*204,\s*21|234,\s*179,\s*8|d97706|217,\s*119,\s*6|--anteraja-yellow|--anteraja-gold|--shadow-yellow|Poppins'
```

Expected: no output. If any line is printed, open that file, fix it following the same pattern used in Tasks 1–9 for that file type, then re-run this step.

- [ ] **Step 2: Rebuild once more in case Step 1 required a fix in `Bracket.css`**

Run: `npm run build`
Expected: exit code 0, no errors.

- [ ] **Step 3: Run the full existing test suite**

Run:
```powershell
node --test tests\app.test.js tests\app-events.test.js tests\bracket.test.js tests\ui.test.js tests\style.test.js tests\tournament.test.js tests\index.test.js
```

Expected: `# pass 21`, `# fail 8` (the same 8 pre-existing, styling-unrelated failures documented in the design spec's Testing/Verification Plan — `draw all persists...`, `score change keeps...`, both `saveParticipantRow...` tests, both `bracket.test.js` render tests, and both `index.test.js` structural-HTML tests). If the fail count is higher than 8, or any of those 8 test names changed, investigate — that would indicate this refactor broke something beyond styling.

- [ ] **Step 4: Manual visual check**

Run: `npx http-server -c-1 -p 8080` (leave running)

Open `http://localhost:8080/index.html` in a browser: confirm magenta/kuning branding, toggle dark/light via the header button, confirm both look correct and text is readable. Open `http://localhost:8080/preview.html` similarly (may need a bracket saved in localStorage first, or just confirm the header/QR-card styling loads without console errors). Stop the server (Ctrl+C) when done.

- [ ] **Step 5: Final commit (only if Step 1 required fixes)**

```bash
git add -A
git commit -m "style: final cleanup pass for Anteraja brand theme refactor"
```

If Step 1 found nothing to fix, no commit is needed for this task — the plan is complete after Task 10's commit.
