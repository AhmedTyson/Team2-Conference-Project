# Load Tests — ThreeDOS Itinera API

Two runners provided. Both hit a **running** Laravel instance over real HTTP.

## 1. PHP runner (zero-dependency, works now)

```powershell
php artisan serve --port=8000
# new terminal
php tests/Load/load_test.php            # 15s, authed public reads + /user + /trips/create
$env:DURATION=30; $env:BASE_URL="http://127.0.0.1:8000/api"; php tests/Load/load_test.php
```

Output: `requests=.. errors=.. error_rate=.. avg=.. p50=.. p95=.. p99=..`

Needs seeded users: `TEST_EMAIL` / `TEST_PASSWORD` env vars (default `admin@threedos.com` / `password`). Run `php artisan migrate:fresh --seed` first.

## 2. k6 runner (industry standard, richer scenarios + thresholds)

Install k6 (one of):

```powershell
winget install k6          # or: choco install k6
```

Run:

```powershell
k6 run tests/Load/load-test.js
# override base url / traffic:
k6 run -e BASE_URL=http://127.0.0.1:8000/api -e TARGET_VUS=25 tests/Load/load-test.js
```

Scenarios:
- **smoke** — 1 VU, 10 iterations, full auth flow (login → me → create trip) + public reads
- **load** — ramping VUs (default 10, `TARGET_VUS` overrides) mixed public reads + authed reads

Thresholds (fail ≠ 0 exit): error rate < 1%, p95 latency < 500ms. Use `--summary-trend-stats="avg,p(50),p(95),p(99)"` for latency stats.

## Caveats

- `php artisan serve` is **single-threaded** and SQLite is single-writer. Concurrency figures are only meaningful for relative (baseline vs. after-change) comparison. For real numbers run behind phph-fpm / RoadRunner / Octane with a real DB.
- Auth writes (`/v1/trips` POST) are lock-prone under load; the load scenario keeps them out of the heavy loop.
- Load scripts are **not** part of the PHPUnit suite; exclude `tests/Load` from coverage (phpunit.xml default excludes nothing under tests/, but the `.php` runner is never autoloaded).