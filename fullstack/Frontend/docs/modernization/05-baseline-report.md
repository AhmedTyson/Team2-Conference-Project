# 05 — Baseline Report (Phase 1)

Date: 2026-08-19. Tag: `baseline-2026-08-19` (HEAD = 7c5e1c66). NO code modified during this phase — measurements only.

## 1. Method

- Served: `fullstack/Frontend` via `python -m http.server 8100` (static, no backend — API calls to localhost:8000 excluded from scoring).
- Puppeteer-core + system Chrome headless.
- All PDF findings re-verified by second probe (first sweep had a path-mapping bug invalidating its rows — rerun with fixed mapping; results below are from the corrected run).

## 2. Page inventory (verified)

116 pages: app 28 · root 28 · public 23 · admin 19 · agency 7 · auth 6 · errors 3 · components 2 (orphaned). Assessment claim "118" = stale by 2.

## 3. Responsive sweep (17 representative pages × 320/375/768/1024/1440 = 85 loads)

| Result | Count |
|---|---|
| Loads with JS page errors | 5 (restaurant-details.html at all widths — defect D2) |
| Loads clean | 80 |
| Overflow (scrollWidth > clientWidth) | 15 rows = index/home/search at all widths — **decorative only** |

Overflow analysis: `.giant-text h1` watermark (font-size 26vw, `pointer-events: none`, `mix-blend-mode: overlay`) exceeds viewport by design; `body { overflow-x: hidden }` (public.css:15) contains it — no scrollbar user-visible. **Classified non-actionable.**

## 4. Console & JS error check (116 pages @1280 + 85 responsive loads)

**Zero CDN failures** — Tailwind CDN, Font Awesome, Google Fonts, GSAP, Leaflet, Echo/Pusher all reachable (baseline for Phase 2 CDN swap).

### Baseline defect ledger (pre-existing; NOT fixed in Phase 1 — Phase 2 task 0)

| ID | Severity | Page(s) | Defect | Evidence |
|---|---|---|---|---|
| D1 | **HIGH** | `app/payments.html` | `assets/js/modules/customer/payments.js:206` — `SyntaxError: Unexpected token '}'` — checkout/payments JS dead | `node --check` fails |
| D2 | **MED** | root `hotel-details.html`, `restaurant-details.html`, `attraction-details.html`, `destination-details.html` | **Double script load**: legacy `assets/js/{config,api,session,nav-config,app-shell,ui}.js` (flat) + modern `assets/js/core/*` — `Auth is not defined`, `el is not defined` at runtime | script list + pageerror |
| D3 | **MED** | `public/attraction-details`, `attractions`, `destination-details`, `destinations`, `hotels`, `hotel-details`, `restaurant-details`, `restaurants` (8 pages) | `Auth is not defined` (legacy cookie cut — incomplete/incompatible script set for public copies) | pageerror |
| D4 | **HIGH** | `public/weather.html` (inline, line ~148) | Truncated statement: `window.` <EOL> — `Unexpected token '}'`; weather JS partially dead | node/pageerror |
| D5 | **HIGH** | `public/plans.html` (inline, line ~145) | Same `window.` truncation — plans page JS partially dead | pageerror |
| D6 | **MED** | `app/availability.html` | `<script src="../assets/js/core/sidebar.js">` — **file does not exist** → 404, missing nav behavior | linkcheck + HTTP 404 |
| D7 | **LOW** | `app/booking.html` | `<script src="../assets/js/booking.js">` — file does not exist (legacy `js/booking.js` exists; path stale) → 404 | linkcheck + HTTP 404 |
| D8 | **LOW** | `app/copy-wizard.html`, `app/itinerary.html`, `app/trip-map.html` | Link target `app/index.html` does not exist (3 dead nav links) | linkcheck |
| D9 | **LOW** | `overview.html` → `create-trip.html` (root), `search.html` → `categories.html` (root), `public/about.html` + `public/index.html` → `public/explore.html` (×2) | 5 broken nav links (correct target exists elsewhere in repo) | linkcheck |
| D10 | INFO | `public/plans.html`, `public/weather.html`, `app/payments.html`, `app/payment-history.html` | payment-history.html is a redirect shim → payments.html (works); included for completeness | code read |

Eliminated during analysis (not defects):
- `hotels/*.jpg` / `restaurants/*.jpg` 404s on catalog pages → resolved to backend `/storage/` image path (apiBase + `/storage/`) — environmental (no backend locally), not repo.
- All `http://localhost:8000/api/*` 401s → no session in headless context — expected.
- `components/*.html` broken links → orphaned files.
- Background API 404s (e.g. `/api/weather`) → endpoint differences on dev backend, environmental.

## 5. Broken-link crawl (1371 internal links)

- 82 broken total: 74 inside orphaned `components/footer.html|navbar.html` (excluded), **8 real** = D6, D7, D8 (×3), D9 (×4 → actually 5 links: overview 1, search 1, public about 1, public index 2). Fixed-source list above.

## 6. CSS / JS inventory (verified)

- CSS 32 files / 13,942 lines: `assets/css/` 20 files (~12.5k) + legacy `css/` 11 files (~1.4k) + 1 dead shim. (See 01-repository-audit.md)
- JS: `assets/js/` 146 files / 35,918 lines (1,123 refs) + legacy `js/` 30+ files (293 refs).
- Dynamic Tailwind classes: **none found** in either tree (`bg-${…}` patterns zero) — R-02 retired.

## 7. Visual regression baseline

85 screenshots at `…\Temp\opencode\baseline-shots\{area}\{page}-{width}.png` (root/app/admin/agency/auth areas). Re-shoot in later phases: `visual-baseline2.js` (drawer forced closed, 1.5s settle, fullPage=false). Overflow bookkeeping above.

## 8. Deployment checks

- Repo-root `Dockerfile` (nginx:alpine → Railway) — unchanged; `entrypoint.sh` injects `__API_BASE__` marker into `config.js` at boot (config.js:17-20).
- **R-09 confirmed**: repo-root `.dockerignore` = `.git`, `**/node_modules`, `fullstack/Backend` → `fullstack/Frontend/{docs,branc-assets,scratch,components,tasks}` all SHIP into the runtime image (Frontend/.dockerignore is ignored: build context = repo root). `docs/` contains modernization docs; `branc-assets/` + `scratch/` contain dev junk. Action deferred to Phase 2 (add `.dockerignore` entries + verify nginx.conf listing).
- `nginx.conf`: serves static root; SPA fallback per page (no rewrite) — confirm listing in Phase 2 before moving CSS.

## 9. Risk register updates

- R-02 (dynamic classes in legacy js/): **CLOSED** — zero matches in both trees.
- R-09 (shipping junk dirs): **CONFIRMED** — action item Phase 2.
- New: baseline defect ledger D1–D9 queued as **Phase 2 task 0** (fix existing breakage before CDN swap so Phase-2 diff is attributable).
- Note: `body{overflow-x:hidden}` exists but is body-only — `html` remains unscrolled for decorative overflow; harmless today.

## Exit criteria

- Baseline branch/tag: `baseline-2026-08-19` ✓
- Responsive sweep 5 widths: ✓ (85 loads, 17 pages)
- Console-error check: ✓ (zero CDN failures; ledger D1–D9)
- Broken-link check: ✓ (8 real)
- Page/CSS/JS inventory: ✓ (01-repository-audit.md)
- Visual regression baseline: ✓ (85 shots + overflow bookkeeping)