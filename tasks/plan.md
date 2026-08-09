# Implementation Plan: Reorganize routes/api.php + Update Postman Collection

## Objective
Reorganize `routes/api.php` into a consistent, domain-ordered structure matching the 5-domain architecture (Account, Catalog, Trips, Commerce, System) with **zero behavior change** (identical URIs, methods, middleware, route names — 165 endpoints). Then restructure `postman_collection.json` to mirror the new layout and verify full endpoint coverage.

## Current State Analysis
- `routes/api.php` (301 lines, 123 Route calls) grew organically by owner/phase:
  - Mixed import block with stray comments (`// Public Controllers`, `// Admin Controllers` mid-list).
  - Routes scattered: categories at top, auth mid-file, admin CRUD nested **inside** a mega `auth:api` group (lines 76-204), explorer/weather/plans/AI/checkout/paymob/notifications/reports appended after.
  - Inconsistent path slashes (`'flights'`, `'hotels'`, `'restaurants'` missing leading `/`), missing `->name()` on many routes, `surveys` resource unprefixed.
  - `POST /review` bound to `GroqService::class` as controller (service-as-controller smell — **verify only, do NOT change**; `AiFeatureTest` covers it and must stay green).
- Verified: 165 routes registered, **0 duplicates**, 0 name conflicts (JSON route dump). Route order is safe to rearrange (all URI+method keys unique).
- `postman_collection.json` (120 KB, schema v2.1.0, "ThreeDOS API - Fully Organized"): 35 flat folders, no domain grouping, auth endpoints partially covered.

## Dependency Graph

```
Route baseline snapshot (route:list --json)          (C1, zero-change target)
   │
   ├── Reorganize api.php imports (no behavior)
   │        │
   │        ├── Reorganize route groups by domain     ← order safe: 0 shadows today
   │        │        │
   │        │        └── Consistency sweep (slashes)  (URLs unchanged — verified after)
   │        │
   │        └── Verify: after-snapshot ⚡ before-snapshot (identity diff)
   │
   └── Postman restructure (folders by domain ← mirror route layout)
           └── Coverage audit: 165 API URLs vs collection requests
```

Implementation order: baseline → api.php reorg → verify identity → postman mirror → coverage audit → full test suite + commit.

## Vertical Slicing Strategy
1. **Phase 0 — Baselines** (snapshots before any edit: routes, tests, postman inventory).
2. **Phase 1 — Import block cleanup** (alpha, domain-grouped `use` statements; remove comments).
3. **Phase 2 — Route group reorganization** (domain-ordered sections; public→auth→admin within each domain; pure move).
4. **Phase 3 — Consistency sweep** (leading slashes, comments parity, optional uniform naming — only additions, never renames).
5. **Phase 4 — Verification** (`route:list --json` identity diff + `php artisan test`).
6. **Phase 5 — Postman update**: rebuild collection into domain folders (Account/Catalog/Trips/Commerce/System w/ Admin subfolders), preserve variables/scripts, coverage audit vs 165 endpoints.
7. **Phase 6 — Final checkpoint**: full suite + collection JSON validation + commit.

## Risks & Guardrails
- **HIGH: never add/remove/rename routes, names, or middleware.** Identity diff via `route:list --json` (sort-stable sets) is the gate for Phases 1-3.
- `GroqService@generateAi` used as controller — leave as-is (spec audit only, `AiFeatureTest` must pass).
- Route ordering: all (method, uri) unique verified (0 dups) → safe to reorder.
- Postman: preserve existing request payloads/headers; only folder structure + coverage changes.
- Do **not** modify URI `surveys` prefix (public? — stays: `auth:api` + `apiResource('surveys')`; changing it would** alter contract) — organizing only.

## Testing & Verification
- After api.php change: `php artisan route:list --json` identity vs baseline (sets: method+uri+controller+middleware, names).
- `php artisan test` → expect 105 passed (340 assertions), unchanged.
- Postman: JSON parses, schema v2.1.0 valid, request count == 165, no duplicates.