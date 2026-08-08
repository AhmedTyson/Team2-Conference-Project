# Frontend Data-Fetching Investigation Report

**Scope:** Why the 8 admin pages (users, trips, destinations, hotels, restaurants, countries, attractions, reviews) rendered no data.
**Date:** 2026-08-08
**Method:** Static-server audit → JS parse check → live backend probes → DOM contract audit → headless-Chrome E2E with captured console/page errors.

## 1. Evidence collected

### 1.1 Static serving (causal)
- Python `http.server` on :8080 was rooted at the wrong directory: admin pages returned Python's raw 404 page ("Nothing matches the given URI") — the source of "page tells me nothing matching the url".
- Fix: `python -m http.server 8080 --directory C:\Programming\conference\Team2-Conference-Project\frontend` (PID 33472). All pages now 200.

### 1.2 Shared JS parse corruption (root cause 1 — killed ALL pages)
- `admin-crud.js` contained a corruption at (old) line 494: `"<td...>` + backtick + newline mangled a template literal inside `user-details.html`-related helper → `SyntaxError: Unexpected end of input`. Introduced by an earlier automated edit.
- Verified acorn @ 8: 0 errors across all 21 frontend JS files after repair. Version bumped: `admin-crud.js?v=5` → `?v=8`.

### 1.3 Shared JS runtime error (root cause 2 — killed ALL pages)
- `admin-chrome.js` executed `panel.hidden = true;` before `const panel` was declared → `ReferenceError (TDZ)` on every admin page boot.
- Removed the stray statement; all pages now boot (role chip "Super Admin" renders). `?v=11` → `?v=12` across pages.

### 1.4 Container selector mismatch (root cause 3 — killed users/trips/reviews only)
- `admin-crud.js` hardcoded `el("crud-table")` in `load()`, `renderTable()`, and the host fallback. Destinations/hotels/restaurants/countries/attractions pages have `<div id="crud-table">`; users/trips/reviews use per-module ids `users-table` / `trips-table` / `reviews-table` → host null → silent no-op.
- Fix: `tableHost() = el((module||"")+"-table") || el("crud-table")` used at all 3 call sites.

### 1.4 Missing symbol in row renderer (root cause 4 — tried all rows, threw after fix 1–3)
- `renderTr` referenced `moduleName` (never declared) → `ReferenceError` once data arrived, on every page.
- Fix: `const moduleName = document.body.dataset.module || ""` at top of `renderTr`.

## 2. Backend / data proof (all green, not the cause)
- Login `POST /api/login` → 200; token length 316.
- GET `/v1/admin/{users,trips,destinations,hotels,restaurants,countries,attractions,reviews}` with Bearer → all 200, shape `{data, links, meta}`, real rows (users 11, trips 8, destinations 40, hotels 53, restaurants 54, countries 250, attractions 20, reviews 50).
- No-auth → `401` (auth middleware working).
- Permissions: super_admin has all 14 perms; role guards confirmed present.
- CREATE/PUT smoke on `/v1/admin/users` → 200/200 (test user force-deleted afterward).
- Known, out-of-scope: `/api/surveys` → 500; `DELETE /v1/admin/users/{id}` genuinely not defined (design: `active`/`block` toggles instead).

## 3. Root-cause chain (single story)
1. Python server mis-rooted → all assets 404 (only URL-level symptom).
2. `renderTable` + `load` were unreachable at the time (TDZ panic in admin-chrome.js), so nothing ever fetched or painted, even when data existed.
3. When that was fixed, parse corruption in admin-crud.js stopped the module from loading at all.
4. When parse was fixed and a module rendered, the selector mismatch no-oped on 3 pages, and `moduleName` ReferenceError aborted the row loop on all pages in the same rendering pass.

The same 4 defects produced the same visible symptom ("no data"), which is why every page "told me nothing".

## 4. Verification (end-to-end)
Automated puppeteer-core run from fresh Chrome headless, all 8 pages, `networkidle0` + 900ms settle:
- All 8: `tables=1`, `rows=6` (pageSize), `empty=null`, page errors = `[]`, top-right chip "Super Admin".
- Content spot-check (users page): real seeded names + emails rendered (e.g. "Ms. Danielle Ward DDS … acollins@example.org").

## 5. Residual risks (not blockers)
- `admin-user-details.js` still exposes legacy `init()`; runs only on the details page.
- `php artisan route:list` still fails: missing `app/Http/Controllers/PaymobController.php` (referenced by config/provider layer, not routes).
- PSR-4 naming warning: `BudgetSnapShot.php` class `BudgetSnapshot`.
- Stale copy `C:\Programming\conference\frontend` (outside repo) not yet checked/removed.
- Surveys 500 unrelated to admin data.