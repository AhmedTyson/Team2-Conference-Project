# Phase 10 — Release Ready Sign-Off

Date: 2026-08-08 · Branch: `feature/paymob-payments`

## Gates (Phase 10 spec)

| # | Check | Result |
|---|---|---|
| 1 | API docs — Scramble | `dedoc/scramble ^0.13.36` installed, `config/scramble.php` present, UI route `GET /docs/api` registered. ✔ |
| 2 | `config:cache` | `php artisan config:cache` OK (exit 0), then cleared. ✔ |
| 3 | Route cache (release hygiene) | `php artisan route:cache` was BROKEN: name collision `paymob.callback` (legacy `paymob/laravel-package` registers `paymob/callback` + `paymob/process`). Fixed: our group renamed to `paymob-v1.` + `PaymobGateway` rewired + published `PaymobController.php` restored (was corrupted). Reroute:cache exit 0. ✔ |
| 4 | env params full list export | `docs/ENVIRONMENT.md` — 41 keys, grouped with defaults. ✔ |
| 5 | CI pipeline | `.github/workflows/ci.yml`: `pint --test` job, `phpunit` job (`migrate:fresh --seed` + `php artisan test`), gitleaks job (`gitleaks-action@v2`, avoid workflow_run patterns). Buttons: push main/develop + PRs. ✔ |
| 6 | `migrate:fresh --seed` | Green on sqlite `:memory:` after fixes: (a) `NotificationSeeder` missing uuid `id` → NOT NULL crash (would crash MySQL too); (b) table name mismatches model `$table`: `experienceproviders` → `experience_providers`, model `Experience::$table='experience'` vs migration `experiences`, `Address::$table='address'` vs `addresses`. ✔ |
| 7 | Secrets scan | Local: **NO trust-region patterns** (`sk-`, `AKIA`, `AIza…`, `ghp_…`, `xox…`, PK keys) in git HEAD; only `.env.example` tracked. gitleaks binary not installed on dev machine (Docker daemon off) — gate enforced in CI job `secrets`. ⚠ see caveats |
| 8 | Route count vs audit | Audit claimed 113 API routes. `route:list` = 115 (`114 api/*` + `GET /docs/api` scramble UI); delta = `/api/me/reports` added in Phase 9. ✔ |

## Route → coverage map (test files)

| Route group | Method(s) | Covered by |
|---|---|---|
| auth (register/login/logout/user/refresh/password…) | POST/PATCH | `AuthThrottleTest`, `VerificationTest`, `Sprint1IntegrationTest`, `AiFeatureTest` |
| categories, destinations, hotels, restaurants, attractions, flights | index/show | `Sprint1IntegrationTest`, `HotelTest(Restaurant/Attraction/Country)` + `ContactAndSettingsTest` |
| survey, contact, settings, users/{block} | CRUD | `ContactAndSettingsTest`, `Admin\UserTest` |
| trips CRUD + fork + attach + contributions | CRUD | `Sprint1IntegrationTest`, `ConcurrencyTest` |
| checkout/initiate · paymob webhook/callback | Payment | `PaymentFlowTest` (8 incl. duplicate + cancel terminal lock) |
| ai/generate · ai/review{id} | AI | `AiFeatureTest` (4, Groq mocked) |
| admin reports generate/download · /me/reports | reports | `ReportTest` (5, queued-job lifecycle) |
| admin: categories/destinations/countries/hotels/restaurants/attractions/users | admin CRUD | `tests/Feature/Admin/*` (CategoryTest, DestinationTest, UserTest, CountryTest, HotelTest, RestaurantTest, AttractionTest) |
| notifications · plans · surveys | lifecycle | `Sprint1IntegrationTest`, `ContactAndSettingsTest` |

Test tally: **105 tests / 340 assertions**, all passing (sqlite :memory:, fake storage, sync queue).

## Caveats (non-blocking, tracked)

- **Coverage %** — no xdebug/pcov driver in this PHP build; metric deferred. Add `pcov` to future CI (`shivammathur/setup-php` supports `coverage: pcov`) — target ≥60%.
- **gitleaks local** — ran static scan fallback; full scan happens in CI on the repo (needs Docker daemon or gitleaks binary).
- **CI mysql** — `migrate:fresh --seed` in pipeline uses sqlite `:memory:` (same env as phpunit.xml); parity with production MySQL is verified only via local MySQL runs.

## Sign-off

API: ✅ docs · ✅ cache · ✅ env list · ✅ CI pipeline · ✅ seed · ⚠ secrets (CI-gated)
Test suite: ✅ 105/105 · Style: ✅ Pint

— ready for merge review + client approval.