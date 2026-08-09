# Tasks: Reorganize routes/api.php + Update Postman Collection

> Supersedes the completed 5-domain migration list (committed). Tracks the routes-reorg spec.

## Phase 0: Baselines (read-only)

### Task 1: Route Baseline Snapshot
**Description:** Capture exact route state before edits, to diff against after reorg.
**Acceptance criteria:**
- [x] `php artisan route:list --json` saved to `tasks/routes/snapshot.before.json`
- [x] Canonical extract: `method | uri | controller | sorted-middleware | name` — 165 records, 0 duplicates, 0 name conflicts
- [x] `php artisan test` green: 105 passed (340 assertions)
**Verification:** Snapshot shows 165 routes
**Files:** `tasks/routes/snapshot.before.json`
**Size:** XS

### Task 2: Postman Inventory
**Description:** Enumerate collection structure for later coverage audit.
**Acceptance criteria:**
- [x] `tasks/postman/inventory.before.json` generated: 35 folders, request count, URL+method per request
- [x] Note which auth endpoints exist (register/login/forgot/reset/verify/logout/refresh)
**Verification:** Collection parses via `ConvertFrom-Json`
**Files:** `postman_collection.json`, `tasks/postman/inventory.before.json`
**Size:** XS

---

## Phase 1: api.php imports

### Task 3: Clean Import Block
**Description:** Group `use` statements by domain (Account, Catalog, Trips, Commerce, System), alphabetical within domain; drop stray `// Public Controllers` / `// Admin Controllers` comment lines.
**Acceptance criteria:**
- [x] All 35 imports present, domain-grouped, alpha-sorted
- [x] No route lines touched in this task
**Verification:** `php -l routes/api.php`
**Files:** `routes/api.php`
**Size:** XS

---

## Phase 2: Route reorganization (pure moves — no URI/method/middleware/name changes)

### Task 4: Account Section
**Description:** Group auth + profile + admin-users routes into the file's first section. Auth public: register, login, forgot-password, reset-password, email verify. Auth'd: me/user, logout, refresh, verify-notice, resend, update profile. Admin: users index/show/store/update/active/block.
**Acceptance criteria:**
- [x] All 13 auth + 6 admin-user routes contiguous, section commented `// ==== Account ====`
- [x] Identity diff (Task 9) eventually zero
**Files:** `routes/api.php`
**Size:** S

### Task 5: Catalog Section
**Description:** Group public explorer (categories, destinations, hotels, flights, restaurants, attractions, site-settings) then admin CRUD (categories, countries, destinations, flights, hotels, attractions, restaurants) into a `// ==== Catalog ====` section. Also fold the top-level categories routes (public + admin) here from their current standalone position.
**Acceptance criteria:**
- [x] All 31 Catalog routes in one section (public first, then admin)
**Files:** `routes/api.php`
**Size:** M

### Task 6: Trips Section
**Description:** Group trips (create, store, show, attach, detach, fork), interactions (favourites, reviews), maps (destination, trip), AI (POST `/review` → `GroqService::class`, GET `/review/{id}`), admin trips + reviews into single section.
**Acceptance criteria:**
- [x] All 15 Trips routes contiguous; `POST /review` binding untouched
- [x] `AiFeatureTest` green (existing coverage proves behavior preserved)
**Files:** `routes/api.php`
**Size:** M

### Task 7: Commerce Section
**Description:** Group plans (6 routes), checkout idetial (1), paymob webhooks (2) into `// ==== Commerce ====` section.
**Acceptance criteria:**
- [x] All 9 Commerce routes contiguous
**Files:** `routes/api.php`
**Size:** S

### Task 8: System Section
**Description:** Group surveys, contacts (public store + admin inbox), weather, dashboard, notifications, admin notifications, reports, admin settings into final `// ==== System` section (goes last; survey resource + weather currently mid-file).
**Acceptance criteria:**
- [x] All 23 System routes contiguous, last in file
**Files:** `routes/api.php`
**Size:** M

---

## Phase 3: Consistency sweep

### Task 9: Path Normalization + Section Headers
**Description:** Standardize leading slashes on group-relative paths missing them (`flights`, `hotels`, `restaurants`, `countries`, `analytics`); ensure `// ==== <Domain> ====` header above each section; add `// ---- Admin ----` sub-comments where useful. URI contract unchanged (Laravel tolerates optional leading `/`; verify).
**Acceptance criteria:**
- [x] No path without leading slash; sections headers everywhere
- [x] No `->name()` renames added; no middleware added/removed
**Verification:** Identity diff (Task 10) zero
**Files:** `routes/api.php`
**Size:** S

---

## Phase 4: Gate

### Task 10: Identity Verification
**Description:** Regenerate `route:list --json`, diff canonical (method+uri+controller+middleware+name) vs `snapshot.before.json`.
**Acceptance criteria:**
- [x] After == Before (order-insensitive; name set identical)
- [x] `php -l routes/api.php`; full suite green
- [x] Sampled `route('login')`, `route('plans.subscription')`, `route('paymob-v1.webhook')` resolve
**Verification:** Diff script exit 0; `php artisan test` 105 passed
**Files:** `tasks/routes/snapshot.after.json`
**Size:** S

> **GATE: if diff ≠ 0 → abort Postman work, fix drift first.**

---

## Phase 5: Postman collection

### Task 11: Mirror Domain Structure
**Description:** Restructure `postman_collection.json` folders into domain tree matching api.php: `Account` (Auth, Admin-Users), `Catalog` (Explorer, Admin-*), `Trips`, `Commerce` (Plans, Checkout, Paymob), `System` (Contacts, Weather, Dashboard, Surveys, Notifications, Reports, Admin-*). Relocate existing 35 folders under parents; **do not edit requests** (URL, body, headers, variables).
**Acceptance criteria:**
- [x] Collection parses (`ConvertFrom-Json`), request count unchanged
- [x] 5 sampled requests byte-identical inside item after move
- [x] Folder tree mirrors domain sections (print tree in diff)
**Files:** `postman_collection.json`
**Size:** M

### Task 12: Coverage Audit
**Description:** Programmatically compare 165 route endpoints (Task 1 snapshot) against collection request (method+URL after `{{base_url}}` substitution).
**Acceptance criteria:**
- [x] `tasks/postman/coverage.diff.json`: per-route matched/missing list
- [x] Write-up lists missing endpoints (report only — additions decided with user) and surplus (no route) requests
**Verification:** Report generated
**Files:** `tasks/postman/coverage.diff.json`
**Size:** S

### Task 13: Validate + Commit
**Description:** Final validation and commit.
**Acceptance criteria:**
- [x] Collection parses; schema `2.1.0`; `jq empty` ok
- [x] `php artisan test` green; `git status` shows only intended files
- [x] Two commits: (1) `refactor(routes)` prefix (2) `chore(postman)`
**Verification:** Commits pushed? (only if user asks)
**Size:** XS

---

## Checkpoints
1. After Tasks 1-2 — human confirms baselines
2. After Task 10 — HARD GATE zero-diff before touching Postman
3. After Task 11 — human reviews folder tree + coverage report
4. After Task 13 — done