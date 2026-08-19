# 02 — Assessment Validation

Source under review: `docs/modernization-assessment.md` (2,851 words). Every recommendation classified **ADOPT / MODIFY / DEFER / REJECT** with repository evidence (audited 2026-08-19).

## Summary

| # | Recommendation | Decision |
|---|---|---|
| 1 | No framework migration (keep MPA + Vanilla) | ADOPT |
| 2 | Tailwind Play CDN is the biggest structural problem → replace | ADOPT |
| 3 | Tailwind CLI build (no Vite) | ADOPT (v4 CLI per plan correction) |
| 4 | Layered CSS consolidation (17 files / 12k lines) | MODIFY (32 files / 13,942; two trees) |
| 5 | Normalize token-vs-raw-value coexistence | ADOPT (incremental, semantic-only) |
| 6 | Footer/topbar duplication = maintenance trap | MODIFY (mostly already fixed) |
| 7 | Web Components hybrid (pilot: trip modal) | DEFER to Phase 7, pilot-only |
| 8 | Alpine.js islands for high-interaction pages | DEFER to Phase 8 (no Alpine today) |
| 9 | ES Modules / hygiene tooling | DEFER to Phase 10 |
| 10 | Perf: CSS size, request count | ADOPT (measured at Phase 12) |
| 11 | TypeScript migration | REJECT (both docs agree) |

## Itemized validation

### 1. No framework migration — ADOPT
- Evidence: 116 static pages, zero package.json/build tooling in frontend, nginx static server, boot-time API injection. A framework would add a build pipeline for no measured benefit. Matches Decision Rules 5 and 9.

### 2. Tailwind CDN as structural problem — ADOPT
- Evidence: 91/116 pages load `cdn.tailwindcss.com`; Tailwind v4 Play CDN compiles in-browser per page (runtime cost, no dead-code elimination). All 25 non-CDN pages are legacy pages that rely only on `css/` + Font Awesome — **note**: they still depend on hand-written CSS, not Tailwind.

### 3. Tailwind CLI, no Vite — ADOPT (with v4 correction from the plan)
- Evidence: no JS bundling need; static deploy. Correction already in plan: current Tailwind = v4, package is `@tailwindcss/cli`, output is static CSS with zero runtime. Vite = REJECT (no repo evidence justifying it).

### 4. Layered CSS — MODIFY
- Assessment: "17 CSS files, ~12,000 lines."
- Repo: **32 files / 13,942 lines** in two parallel trees (`assets/css/` current + `css/` legacy + 1 dead shim). Layering already partially exists via @import hub (`tokens.css`). Consolidation must therefore: (a) merge legacy `css/` into `assets/css/`, (b) then apply the layered model (base → tokens → components → layouts → pages → utilities). Duplicate namespaces (`css/app.css` vs `assets/css/app.css`) are the biggest merge risk.

### 5. Tokens vs raw values — ADOPT (incremental)
- Evidence: `tokens.css` (1,213 lines) coexists with raw pixels across pages (e.g. `px-3 py-1.5`, `rounded-lg` Tailwind defaults and hand-written `style=` values). Rule from plan: normalize only repeated/semantic/design-system values; no blanket replacement.

### 6. Footer/navbar duplication — MODIFY (partially resolved)
- Assessment flags duplicated footer and divergent topbars as maintenance traps.
- Repo today: **single source already exists** — `core/footer-component.js` (109 pages) and `core/navbar-component.js` render the chrome. `components/footer.html` + `components/navbar.html` are **orphaned** (0 refs). Assessment predates or omits this JS-component layer.
- Remaining trap: `js/` legacy scripts may still render older inline footers on the 25 legacy pages (footer-component.js absent there). Verify in Phase 1.

### 7. Web Components — DEFER (pilot-only)
- Evidence: reusable chrome (navbar/footer) is already componentized in JS; only ~2-3 candidates (modal, search input, status pill) would benefit from encapsulation. Existing HTML partial architecture is effectively dead (components/ orphaned). Decision: Phase 7 pilot on trip modal; do not convert chrome.

### 8. Alpine.js — DEFER to Phase 8
- Evidence: Alpine **not present** anywhere; interaction density per page not yet measured (Phase 8 scan needed). Keep It.api / It.session / services untouched per plan's critical rule.

### 9. ES Modules — DEFER to Phase 10
- Evidence: script-ordering architecture works across 1,149 script references; 293 legacy refs must be migrated first. Hygiene (ESLint/Prettier/AbortController) is orthogonal — can start any time, but not before Phase 2 stabilizes.

### 10. Perf targets — ADOPT
- Evidence: 3 Font Awesome versions served; GSAP dual-sourced; Tailwind CDN 91× runtime compilation; hand-rolled `?v=` cache-busting. Phase 2 removes the largest cost (Tailwind runtime); Phase 12 measures before/after.

### 11. TypeScript — REJECT
- Both the assessment and the execution plan reject it at this stage. No repo evidence (no type surface, no tooling) justifies the migration cost.

## Deviations from the plan's critical rule (nothing to defer yet)

- Plan demands classification with evidence — done above. No recommendation was rejected without evidence.
- Plan's "repository evidence beats the assessment" rule: two assessment claims (page count, CSS file count) were corrected to current repo state. All subsequent phases must re-verify counts before acting.