# Frontend Data-Fetching Fix Plan

Companion to `frontend-data-fetching-investigation.md`. Status: **all fixes applied and verified end-to-end**.

## Applied fixes

| # | Defect | Fix | Files touched | Version bump |
|---|--------|-----|---------------|--------------|
| 1 | Mis-rooted static server | Restart with `--directory C:\Programming\conference\Team2-Conference-Project\frontend` | – (runtime) | – |
| 2 | `panel.hidden` TDZ panic in `admin-chrome.js` | Removed stray statement before `const panel` | `admin-chrome.js` + 12 HTML refs | `?v=11` → `?v=12` |
| 3 | Mangled template literal in `admin-crud.js` (parse failure) | Repaired corrupted `\`n` inside helper; acorn-clean | `admin-crud.js` | `?v=5` → `?v=6` |
| 4 | Hardcoded `el("crud-table")` host | `tableHost()` = `el((module||"")+"-table") || el("crud-table")`, used in `load()`, `renderTable()`, host fallback | `admin-crud.js` + 8 HTML refs | `?v=6` → `?v=7` |
| 5 | `moduleName is not defined` in `renderTr` | `const moduleName = document.body.dataset.module || ""` | `admin-crud.js` + 8 HTML refs | `?v=7` → `?v=8` |

All HTML cache-busting refs updated to `admin-crud.js?v=8` / `admin-chrome.js?v=12`.

## Verification results (headless Chrome, all 8 admin pages)

| Page | Tables | Rows on page 1 | Console/page errors |
|------|--------|----------------|---------------------|
| users | 1 | 6 of 11 | none |
| trips | 1 | 6 of 8 | none |
| destinations | 1 | 6 of 40 | none |
| hotels | 1 | 6 of 53 | none |
| restaurants | 1 | 6 of 54 | none |
| countries | 1 | 6 of 250 | none |
| attractions | 1 | 6 of 20 | none |
| reviews | 1 | 6 of 50 | none |

- Spot-check (users): real seeded rows render with names + emails; role chip "Super Admin" present; `consoleError[]` on every page.
- Auth regression: no Bearer token → `401`.
- Backend CRUD smoke: create/update on `/v1/admin/users` → 200/200 (test record force-deleted).

## Exit criteria — done
1. [x] Only fixes backed by recorded evidence.
2. [x] Minimal footprint: 2 shared JS files.
3. [x] Back-end behavior left unchanged (no new routes, no masked empty data).
4. [x] E2E green across all admin pages in scope.

## Not this incident (deferred, tracked elsewhere)
- `SurveysController` 500; missing `PaymobController.php` (blocks `route:list`); `BudgetSnapShot` PSR-4 naming; `contacts` module absent (no `contacts` table, by design); user records have no DELETE route (design: `active`/`block` toggles).