# 03 — Architecture Decisions

Phase 0 output. Decisions are provisional pending Phase 1 baseline verification; each carries evidence and a rollback path (Decision Rule 7).

## ADR-1: Remain an MPA with Vanilla JS + Tailwind. No framework. — ADOPTED

- **Context:** 116 static pages, nginx + Railway, API base injected at boot, no frontend build pipeline. Business logic lives in `It.*` namespace (session, api, services) across 1,149 script references.
- **Decision:** Preserve MPA architecture. No React/Vue/Svelte, no SPA router, no SSR framework, no TypeScript (per plan Rule 5 and assessment).
- **Evidence:** pages/app-28, public-23, admin-19, agency-7, auth-6, errors-3, root-28; zero JS framework imports (no react/vue/svelte strings in any HTML).
- **Rollback:** n/a (non-destructive).

## ADR-2: Tailwind v4 static build via `@tailwindcss/cli`. No Vite. — ADOPTED

- **Context:** 91 pages compile Tailwind in-browser via Play CDN; Tailwind v4 CLI produces static CSS with zero runtime.
- **Decision:** Introduce `package.json` (frontend only, devDependency `@tailwindcss/cli` + `tailwindcss`), input CSS with `@import "tailwindcss"`, content scanning of `*.html` + `assets/js/**/*.js` (+ legacy `js/` until migrated). Output single `dist/app.css` (or versioned build). Vite REJECTED: no JS-bundling evidence.
- **Dynamic classes:** only known runtime-composed value is `notif-icon-box ${cat.class}` — semantic hook, not Tailwind; no safelist needed. Phase 2 must still scan legacy `js/` for `bg-${...}` composition.
- **Rollback:** keep all existing CSS files + CDN links untouched until sign-off; swap back per-page by reverting the `<link>` tag.

## ADR-3: Two CSS trees → consolidate into `assets/css/`, then apply layered model. — ADOPTED (Phase 3)

- **Context:** `assets/css/` (20 files) + legacy `css/` (11 files, overlapping names: `css/app.css` vs `assets/css/app.css`) + 1 dead shim (`css/common.css`).
- **Decision:** Move legacy `css/` files into `assets/css/legacy/` (no deletions), fix page references (293 refs live today), then Phase 3 layering: base → tokens → components → layouts → pages → utilities, with `main.css` entry. Dead `.notif-*` rules and 1-line shim may be removed only after visual verification (plan: search usages → verify equivalent → visual test → remove).
- **Rollback:** legacy/ retained in-tree until end of Phase 3.

## ADR-4: CDN normalization. — ADOPTED (Phase 2, low-cost parallel task)

- **Context:** FA 6.0.0-beta3 / 6.4.0 / 6.5.1 mixed; GSAP dual-sourced (cdnjs + jsdelivr, same 3.12.5); Leaflet/Echo/Pusher single-source.
- **Decision:** One Font Awesome version (6.5.1) across all pages. Keep external CDNs for FA/GSAP/Leaflet/Echo/Pusher (self-hosting deferred to Phase 12 perf measurement). Remove Tailwind CDN only (ADR-2). Google Fonts: consolidate to one `css2` link per page family set (some pages duplicate preconnects).
- **Rollback:** per-page revert of `<link>`/`<script>` tags.

## ADR-5: Chrome single-source = `core/footer-component.js` + `core/navbar-component.js`. — ADOPTED (Phase 6)

- **Context:** `components/footer.html` + `components/navbar.html` orphaned; JS components active on 109 (footer) and root pages (navbar); 25 legacy pages may lack them.
- **Decision:** JS components are the single source of truth. `components/*.html` are deleted only after verifying zero references (already zero) — they are dead files. Legacy pages (25) get footer-component.js added during Phase 6 (or are legacy-retired).
- **Rollback:** files deleted from git = recoverable via history.

## ADR-6: Tokens — incremental, semantic-only normalization. — ADOPTED (Phase 4)

- **Context:** `tokens.css` (1,213 lines) coexists with raw pixels in Tailwind classes and inline styles.
- **Decision:** Normalize only repeated + semantic + design-system values (`--color-primary`, `--space-1`, `--radius-sm`). No blanket raw-value replacement (plan's rule).
- **Rollback:** additive tokens; removals gated on usage search.

## ADR-7: Web Components — pilot-only, not default. — ADOPTED (Phase 7)

- **Context:** only 2–3 candidates with genuine encapsulation benefit; chrome already componentized.
- **Decision:** Pilot on trip modal (assessment's pick). Then evaluate search input, status pill, table wrapper. Everything else stays HTML + JS-component.
- **Rollback:** single-pilot scope contains blast radius.

## ADR-8: Alpine.js — decision-gated, not mandatory. — DEFERRED (Phase 8)

- **Context:** Alpine absent today; interaction density unmeasured.
- **Decision:** Measure per-page interaction (DOM queries, listeners, state, renders) in Phase 8; classify LOW/MEDIUM/HIGH; only HIGH pages get Alpine islands. It.api / It.session / services / business logic never converted (plan's critical rule).
- **Rollback:** island-scoped `x-data`, removable per element.

## ADR-9: ES Modules & hygiene — after stabilization. — DEFERRED (Phase 10)

- **Context:** script-order architecture works; 293 legacy refs outstanding.
- **Decision:** Migrate `js/` → `assets/js` paths first; then convert IIFEs to modules incrementally, page by page; ESLint/Prettier configured with `--check` only until Phase 10 (no formatting churn during earlier phases).
- **Rollback:** per-page script tag swap.

## ADR-10: Deployment unchanged. — ADOPTED

- **Context:** repo-root Dockerfile → nginx → Railway; `entrypoint.sh` injects API base into `config.js` at boot; hand-rolled `?v=` cache busting.
- **Decision:** Phase 2 artifact (`dist/app.css`) copied into image via Dockerfile COPY (already covers whole Frontend dir). Cache-busting: replace `?v=` with build-manifest hashing only if Phase 12 shows benefit; keep `?v=` convention meanwhile.
- **Rollback:** n/a (additive COPY).

## Standing rules (plan Decision Rules 1–10, adopted verbatim)

1. Repository evidence beats the assessment.
2. Preserve working behavior unless demonstrated reason to change.
3. Prefer extraction over rewriting.
4. Prefer incremental migration over big-bang.
5. No framework migration.
6. Every architectural decision includes evidence.
7. Every destructive change requires a rollback path.
8. Do not optimize code that has not been measured.
9. No library just because popular.
10. If Vanilla JS is simpler, keep Vanilla JS.