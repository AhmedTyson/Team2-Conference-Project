# 04 — Risk Register

Phase 0 snapshot (2026-08-19). P0 = can break the app or lose data; P1 = high disruption; P2 = manageable.

| ID | Risk | Phase | Prob | Impact | Mitigation / Rollback |
|---|---|---|---|---|---|
| R-01 | **Tailwind CDN removal breaks styling on legacy pages.** 25/116 pages have NO Tailwind CDN today (they use `css/` only). After build, every page must point at the same build CSS; legacy pages will see new global styles they never had. | 2 | High | High | Serve build CSS alongside existing files; page-by-page swap; visual check at 320/375/768/1024/1440 per page batch; rollback = revert `<link>` tag per page (ADR-2). |
| R-02 | **Runtime-composed Tailwind classes missed by static scan** in legacy `js/` tree (293 refs, unscanned for `bg-${…}` patterns). | 2 | Med | High | Phase 2 task 6-7: exhaustive regex sweep (`bg-\$\{`, `text-\$\{`, `border-\$\{`, `-${...}-500`) over BOTH js trees + HTML inline handlers; add `@source inline(html)` if needed; keep safelist file for any discovered compositions. |
| R-03 | **Dual CSS trees merge drops rules.** `css/app.css` (748 lines) vs `assets/css/app.css` (1,468) share names but differ; legacy pages depend on the small one. | 3 | High | High | Move (not merge) `css/*` → `assets/css/legacy/*`; rewire refs mechanically; diff page render before/after; delete only after visual sign-off (ADR-3). |
| R-04 | **Font Awesome version drift.** 3 versions across pages (6.0.0-beta3/6.4.0/6.5.1) — beta3 pages render icons that may change or break under 6.5.1. | 2 | Med | Med | One version (6.5.1) globally; spot-check icon-heavy pages (admin, survey, chat); rollback = per-page tag revert. |
| R-05 | **Dual auth state.** `itinera_token/user` vs legacy `tp_token/tp_user`; legacy pages trust tp_* — any session refactor (Phase 10) can split sessions. | 10 | Med | High | Do NOT touch session storage in any phase before 10; Phase 10 migrates tp_* readers one page at a time. |
| R-06 | **Root vs `public/` page duplication (23 pairs).** Two copies of the same page; fixes applied to one tree drift from the other. | 6 | High | Med | Phase 6 component extraction applies fixes once; final consolidation (which tree is canonical) deferred to Phase 11 decision with evidence; no deletion before. |
| R-07 | **Boot-time API injection coupling.** `config.js` API base set by `entrypoint.sh` at container boot — build pipeline must not bake a base URL at build time. | 2 | Med | High | Build CSS only (no JS bundling); never compile `config.js`; verify injected base still wins after deployment. |
| R-08 | **Inconsistent `?v=` cache busting.** Hand-rolled; stale CSS/JS served on hard refresh during rollout. | 2 | Med | Low | Bump query strings in the same commit as file changes; Phase 12 considers manifest hashing. |
| R-09 | **`branc-assets/` + `scratch/` dirs pollute scans.** Non-shipping dirs contain html/js that could pull wrong classes into the build. | 2 | Med | Low | Exclude both from Tailwind content globs and CSS inventory; verify Docker COPY does not ship them (`.dockerignore` exists — confirm contents Phase 1). |
| R-10 | **Dead CSS removal churn.** Several thousand lines estimated redundant; aggressive removal risks subtle visual diffs. | 3 | Med | Med | Plan rule: old rule → search usages → verify equivalent → visual test → remove. No bulk regex deletions. |
| R-11 | **Responsive regressions during layering.** Phase 3 reorders cascade (tokens/base/components/pages order matters with Tailwind layering). | 3 | Med | High | Preserve @import order semantics; run sweep at 5 widths after each layer move; commit per-layer. |
| R-12 | **Alpine island creep.** Once introduced, easy to over-apply and entangle with It.* logic. | 8/9 | Med | Med | Phase 8 density gates (LOW/MEDIUM/HIGH); Alpine for UI state only; business logic remains in It.*; review each island in PR. |
| R-13 | **npm/tooling availability on Railway build.** Docker build runs `npm ci` only if Dockerfile adds it; nginx image currently has no node. | 2 | Med | Med | Build CSS in Dockerfile multi-stage (node:alpine → nginx) OR commit build artifact; decide before Phase 2; rollback = keep CDN links until CI build proven. |
| R-14 | **Baseline drift between audit and Phase 1.** Assessment counts (118 pages, 17 CSS) already stale vs repo (116, 32). | 1 | High | Low | Phase 1 re-runs inventory fresh; every phase re-verifies counts before acting (02-validation note). |
| R-15 | **`public/` CDN pages vs root pages share one CSS contract but divergent markup.** Build CSS must serve both without breaking one. | 2 | Med | Med | Phase 2 sweep covers both trees; report per-tree pass/fail. |

## Open items (checked in Phase 1, not assumed)

- Console-error sweep at all 5 widths (audits so far were targeted, not global).
- Broken-link crawl (internal `href`/`src` 404s) — never run comprehensively.
- `.dockerignore` contents vs `branc-assets`/`scratch` shipping.
- Legacy `js/` dynamic-class sweep (R-02).
- Baseline git tag creation.

## Phase 1 update (2026-08-19 — see 05-baseline-report.md)

- R-02 dynamic-tailwind sweep: **CLOSED** — zero `bg-${…}`-style compositions in BOTH js trees.
- R-09 junk-dir shipping: **CONFIRMED** — repo-root `.dockerignore` only excludes `.git`/`node_modules`/`Backend`; `docs/`, `branc-assets/`, `scratch/`, `components/`, `tasks/` ship into the nginx image. Action: Phase 2 (add ignores, verify nginx.conf).
- Console sweep (116 pages @1280 + 85 responsive loads): **zero CDN failures**; CDN baseline healthy for Phase 2 swap.
- **New: baseline defect ledger (pre-existing, queued as Phase 2 task 0)** — D1 payments.js:206 syntax error (checkout JS dead); D2 4×root detail pages double-load legacy+modern scripts (`Auth`/`el` undefined); D3 8×public catalog pages `Auth` undefined; D4/D5 `public/weather.html` + `public/plans.html` truncated inline `window.` statements; D6 `core/sidebar.js` missing (availability.html); D7 stale `assets/js/booking.js` path (booking.html); D8 3×`app/index.html` dead links; D9 5×broken nav links (overview→create-trip, search→categories, public about/index→explore).
- Responsive overflow: index/home/search at all widths = decorative `.giant-text` watermark, contained by `body{overflow-x:hidden}` — **non-actionable, not a defect**.
- Visual baseline: 85 shots at %TEMP%\opencode\baseline-shots (17 pages × 5 widths); re-shoot protocol = `visual-baseline2.js`.