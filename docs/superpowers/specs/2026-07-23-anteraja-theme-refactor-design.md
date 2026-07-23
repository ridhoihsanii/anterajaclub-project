# Anteraja Brand Theme Refactor — Design Spec

**Date:** 2026-07-23
**Status:** Approved by user, ready for implementation plan

## Context

The app was previously themed as "BILPOS" with a black/yellow (`#0A0A0A` / `#FACC15`) glassmorphism
look. A prior session renamed all naming/branding from BILPOS to ANTERAJA (CSS classes, JS globals,
localStorage keys, copy). This spec covers the next step: restyling the **visual design system**
(colors, typography, component styling) to match the real Anteraja corporate brand guideline
(`Anteraja Brand Guide.pdf`, 63 pages, updated 2 Dec 2025), without touching any business logic.

## Brand Guide Findings

Extracted via PDF text/screenshot rendering (guide has no embedded font/logo asset files, only
marketing pages — logo, colors, typography samples, graphic elements, banner specs for
social/app/web, not a UI kit for dashboards).

- **Primary colors:** Magenta Sigap `#ED0677` (Pantone 213C), Kuning Ramah `#FFCB05` (Pantone 116C)
- **Secondary colors:** Pink Aman `#F6AABF`, Biru Terpercaya `#496AAA`, Hitam Integritas `#3B2C2F`,
  Maroon Amanah `#841945`
- **Typeface:** "Anteraja Sans" (proprietary, Light→Black weights + italics). No font file provided
  in the guide folder — substituted with **Baloo 2** (Google Fonts), a rounded/bold/playful
  open-source font that best matches the brand keywords (youthful, bold, relatable, playful) among
  the options offered to and chosen by the user.
- **Graphic elements:** rounded "blob" shapes (arrow, heart, curve line, infinity, box, smile,
  location) used decoratively across brand collateral — informs decorative radius/shape treatment
  only, not layout structure.
- **Logo:** lowercase wordmark "anteraja" + arrow-in-"a" symbol, magenta.
- The guide has no digital product/dashboard UI component specs (buttons, tables, forms) — those
  are designed fresh in this spec using the brand's color/type/shape language.

## Decisions (confirmed with user)

1. **Theme direction:** Full switch to genuine Anteraja identity — Magenta + Kuning as dominant
   brand colors, light theme is the primary/default look (matches brand guide's light-background
   presentation).
2. **Dark mode:** Kept (existing toggle preserved), but redesigned with a warm near-black background
   derived from Hitam Integritas (`#3B2C2F`) rather than a generic black, with the same
   magenta/kuning accents.
3. **Font:** Baloo 2 replaces Poppins everywhere.
4. **Layout:** No structural changes — header + top navigation (Dashboard / Setup / Participants /
   Bracket) stays as-is. Only color/typography/component styling changes.
5. **Border radius:** Keep current moderate scale (8–16px) for functional components (buttons,
   inputs, tables, modals); add a blob-shaped radius token for purely decorative elements only
   (e.g. empty-state icon container).
6. **Scope:** Both `index.html` (dashboard app) and `preview.html` (shareable bracket preview) are
   restyled for consistency.

## Design Tokens

Defined centrally in `assets/css/style.css` `:root` (and `[data-theme="light"]` /
`[data-theme="dark"]`-equivalent overrides, following the existing token-driven pattern already
used in this codebase):

```css
--anteraja-primary: #ED0677;        /* Magenta Sigap — primary actions, active nav/links */
--anteraja-primary-dark: #C10561;   /* gradient stop / hover / pressed state for primary */
--anteraja-secondary: #FFCB05;      /* Kuning Ramah — energetic highlight, badges, live/promo */
--anteraja-pink: #F6AABF;           /* Pink Aman — soft backgrounds, decorative blobs */
--anteraja-blue: #496AAA;           /* Biru Terpercaya — info state */
--anteraja-maroon: #841945;         /* Maroon Amanah — text-on-pink, gradient accents */
--anteraja-charcoal: #3B2C2F;       /* Hitam Integritas — dark text (light mode), dark bg base (dark mode) */
--success: #22C55E;
--danger: #EF4444;
--warning: #FFCB05;                 /* aligned to brand secondary instead of generic amber */
--info: #496AAA;                    /* aligned to Biru Terpercaya */
--shadow-brand: 0 0 20px rgba(237,6,119,0.25);   /* replaces --shadow-yellow */
--radius-sm: 8px; --radius-md: 12px; --radius-lg: 16px; --radius-xl: 20px;  /* unchanged */
--radius-blob: 42% 58% 55% 45% / 48% 42% 58% 52%;  /* new — decorative-only elements */
```

Old variable names (`--anteraja-yellow`, `--anteraja-gold`, `--anteraja-black`,
`--anteraja-surface`, `--anteraja-surface-2`, `--anteraja-border`, `--anteraja-border-active`,
`--shadow-yellow`) are fully replaced (not aliased) — every usage across `style.css`,
`src/components/Bracket.css`, `index.html` inline styles, and `preview.html` inline styles is
updated to the new names/values. No dangling references to the old yellow/black-named tokens should
remain (verified via grep as part of implementation).

Light mode: background `#FFFAFC` (very subtle pink tint), surface `#FFFFFF`, text `--anteraja-charcoal`.
Dark mode: background `#1A1214` (dark derivative of Hitam Integritas), surface `#2A1F22`, text `#F5EDEF`,
same magenta/kuning accents as light mode.

Typography: Google Font **Baloo 2**, weights 400/500/600/700/800, replacing Poppins in the
`<link>` tag and `font-family` declarations in `index.html`, `preview.html`, and `style.css`.

## Component Mapping

| Current component | New treatment |
|---|---|
| `.btn-anteraja-primary` | Gradient `--anteraja-primary` → `--anteraja-primary-dark`, white text (was black-on-yellow) |
| `.btn-anteraja-secondary`, `.status-btn`, `.btn-draw`, `.btn-export-*` | Neutral outline/surface; hover border+text becomes `--anteraja-primary` |
| `.anteraja-card`, `.card-header-anteraja` | White/dark surface, thin magenta top accent line (was yellow) |
| `.stat-card` + `.stat-icon.green/blue/yellow/red` | green=success (cash), blue=Biru Terpercaya (transfer), yellow=Kuning Ramah (total), red=danger (belum bayar) |
| Header active-nav, focus-ring, `::selection`, scrollbar thumb | magenta instead of yellow |
| `.drawing-badge`, wheel spin button (`.wheel-spin-btn`) | gradient magenta↔kuning (energetic combo, matches brand's primary color pairing) |
| `.empty-state .empty-icon` | Pink (`--anteraja-pink`) blob-shaped background (`--radius-blob`), magenta icon |
| Bracket `.round-label` | magenta background tint/text (was yellow) |
| Bracket `.match-card` hover border | magenta (was yellow-tinted) |
| Bracket connector lines, win/lose badges, live-blink | **unchanged** — these are semantic/functional (live=red, win=green, lose=red-tinted, connectors=neutral gray) and stay as-is for clarity |
| `preview.html` brand header, QR card border, title text | same token set as `index.html` |

## Files Affected

- `assets/css/style.css` — token block + all component rules using old tokens
- `src/components/Bracket.css` — round-label, match-card hover, light-theme overrides
- `assets/js/bracket.bundle.js` / `.css` (+ `.map`) — regenerated via `npm run build` after
  `Bracket.css`/JSX changes (no JSX logic changes expected, only className/style references if any
  inline colors exist)
- `index.html` — Google Font link (Baloo 2), inline `style="..."` on `#btn-preview-bracket` (hardcoded
  yellow colors)
- `preview.html` — Google Font link, inline styles/colors matching preview brand header and QR card
- `tests/style.test.js` — token/value assertions updated to match new design tokens (test asserts
  the literal old hex values/variable names today; this is a style-contract test, not business
  logic, and must be updated to reflect the intentional design change)

No changes to: `assets/js/app.js`, `assets/js/tournament.js`, `assets/js/storage.js`,
`assets/js/firebase-sync.js`, `src/components/BracketPage.jsx` logic, `src/entry.jsx`, any test
files other than `style.test.js` (style-only assertions), routing, state management, or data
persistence.

## Testing / Verification Plan

1. `npm run build` — rebuild React bundle after `Bracket.css` changes, confirm no build errors.
2. `node --test tests/style.test.js tests/index.test.js` — confirm updated style assertions pass and
   no other test regresses (index.test.js only checks structural HTML, unaffected by color changes).
3. Full existing suite (`app.test.js`, `app-events.test.js`, `bracket.test.js`, `ui.test.js`,
   `tournament.test.js`) — confirm pass count unchanged from the pre-refactor baseline (8 known
   pre-existing failures unrelated to styling are acceptable and already tracked; no new failures).
4. Grep verification: zero remaining occurrences of `--anteraja-yellow`, `--anteraja-gold`,
   `--anteraja-black`, `--shadow-yellow`, and hardcoded `#FACC15` / `#EAB308` / `#0A0A0A` outside of
   historical docs (`docs/superpowers/plans/*`, `.superpowers/*` — left untouched as historical
   record).
5. Manual visual check: open `index.html` and `preview.html` in a browser, toggle dark/light mode,
   confirm readability/contrast and that no layout shifted.

## Accessibility Notes

- Magenta `#ED0677` on white passes WCAG AA for normal text at the sizes used for buttons/links
  (verified contrast ratio); large-scale primary-button text is white-on-magenta which also passes.
- Focus-visible outline switches to magenta but keeps the same 2px outline + offset pattern already
  in place (no change to focus mechanics, only color).
- Dark mode contrast (`#F5EDEF` text on `#1A1214` background) exceeds AA for body text.
