# Glassmorphism + Color + Auth Overhaul — 10-Phase Prompt

Reusable implementation prompt (PRD-required glassmorphism skill, basecoatui.com token language).

```
GLASSMORPHISM + COLOR + AUTH OVERHAUL — 10-PHASE PROMPT

Phase 1 — Audit: Map all surfaces (headers, cards, modals, banners, auth
shells). Tag each: glass target / keep solid. Note existing blur usage,
line refs. No edits.

Phase 2 — Tokens: Add brand palette (naive blues + accents) and glass
tokens (blur sm/md/xl/3xl, saturate, border white/20, colored shadows)
to tokens.css, light + .dark.

Phase 3 — Glass utilities: Build glass.css — .glass base + blur levels +
opacity layers (soft/mid/strong) + color-tint variants (color-mix with
tokens, static fallback first) + 3-layer .glass-stack + shadow helpers.
Always: -webkit-backdrop-filter, @supports fallback (solid high-opacity
bg), dark variant per surface, prefers-reduced-motion fallback.

Phase 4 — Auth layout: Gradient bg + blurred color blobs, split-shell
becomes translucent glass, form card = glass card (larger radius,
padding), verify contrast on both themes. NO overflow:hidden on body.

Phase 5 — Sizing pass: Inputs (min 0.78rem/1rem padding, radius-md,
height ≥44px), buttons (min-height 2.9rem), headings, card padding,
spacing rhythm. Consistency across auth + app forms.

Phase 6 — Color application: Brand gradient primary buttons, colored
links/focus rings/checkbox accents, tinted glass on hero panels. Never
break readable contrast.

Phase 7 — Layered depth: Apply glass-stack (3 layers) to hero sections;
layered overlays on modals/drawers; colored shadows for vibrancy.

Phase 8 — Dark mode parity: Every glass surface gets .dark override
(black/40-style bg, white/14 borders, darker shadows). Audit every
surface from Phase 1.

Phase 9 — Validation hardening: Server-driven field errors (422 body.errors
→ per-field inline + shake + focus + scrollIntoView), busy-guard on
submit, generic banner fallback for non-field failures, success states.

Phase 10 — Validation sweep: Checklist — backdrop-blur on every glass
surface, semi-transparent bg, border /20 opacity, no flat backgrounds,
works over gradients, dark variant defined, reduced-motion fallback,
blur ≤16px default (≤32px max), no nested glass, no vars inside
-webkit-backdrop-filter. Run browser check on Chrome + Safari, light +
dark.
```

## Itinera-specific notes
- Tokens: `frontend/assets/css/tokens.css` — HSL triplets, `hsl(var(--x))` wrapper, `.dark` override block.
- Glass system: `frontend/assets/css/glass.css` — `.glass`, `.glass--sm/md/xl/3xl`, `.glass--soft/mid/strong`, `.glass--tint-blue/sky/teal/sun/coral/violet`, `.shadow-*`, `.glass-stack`.
- Import chain: `auth.css` → `tokens.css` + `glass.css`; `admin.css` → `auth.css` (inherits both); `app.css` → `glass.css`.
- Brand palette: `--brand-blue 217 91% 60%`, `--brand-sky 199 89% 55%`, `--brand-teal 172 66% 50%`, `--brand-sun 45 93% 52%`, `--brand-coral 10 85% 60%`, `--brand-violet 262 83% 65%`.
- Safari: `-webkit-backdrop-filter` required, CSS vars unsupported inside it (fixed px values only).
- Auth validation: `auth.js` `mapServerErrors()` handles 422 `body.errors` → per-field + focus/scroll; busy-guard `form.dataset.busy`; banner fallback via `fb.banner(body.message)`.
- Known trap: never `overflow:hidden` on auth `body` — breaks page scroll.
