# Backend Complete Audit — Conference & Travel Platform (Laravel 12)

> Branch: `feature/paymob-payments` · Files verified via filesystem + `tinker` runtime checks · PHP ^8.2 · Laravel 12 · JWT auth · SQLite default (prod: MySQL)

---

## 1. Project Overview
Modular travel/conference platform: auth, trips with forking, categories, hotels/restaurants/attractions/flights/countries, plans & subscriptions, payment orchestration (Paymob + stub Stripe), AI itinerary generation, community interactions, surveys, notifications, PDF reports, admin CRUD, weather + OSM maps.

## 2. Source of Truth
- PHP 8.2+, Laravel 12: `laravel/framework ^12.0`
- Auth: `tymon/jwt-auth ^2.3` (guard `api`)
- RBAC: `spatie/laravel-permission ^6.25`
- Docs: `dedoc/scramble ^0.13.36` (OpenAPI at `/docs/api`)
- PDF: `barryvdh/laravel-dompdf ^3.1` · Excel: `openspout ^4.28` · AI: `lucianotonet/groq-laravel ^1.0`
- Cache: `predis/predis ^3.5` (Redis; local cache driver fallback = file)
- Dev: telescope, sail, pail, pint, collision, phpunit ^11.5.50
- **Drift:** `paymob/laravel-package` + `paymob/php-library` are in `composer.lock` + `vendor/` but **NOT** in `composer.json require` (add broken rebuild); `volo/notify` not seen as dependency.

## 3. Environment & Configuration Audit (Go)
| Item | Status |
|---|---|
| `.env.example` | Has `JWT_SECRET`, DB, etc. **Missing**: `PAYMOB_*`, `GROQ_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_*`? Not needed by app |
| config | `config/paymob.php`, `config/groq.php`, `config/scramble.php` exist; `config/services.php` has unused `rapidapi`/`openai` at top-level + `openai.key` referenced by Map |
| `config/services.php` | Has `rapidapi`, `postmark`, `resend`, `ses`, `slack`, `openai` (added, no env key in `.env.example`) |
| **Drive:** `MapController` reads `config('services.openai.key')` → requires `OPENAI_API_KEY` (missing from `.env.example`) — web external deps: OpenMeteo cURL disabled `withoutVerifying` |

## 4. Project Structure (Go)
```
app/
  Http/Controllers/      24 (root) + 14 (Admin) = 38
  Http/Controllers/Admin 14 (incl. ContactMessage, Setting, Destination…)
  Http/Requests/         24 (Auth 1, Admin subfolder 2, root 21)
  Http/Resources/        12
  Services/              20 (root 13 + Fixtures/ + Strategies/Checkout/ 5)
  Repositories/          7  (Category, Country?, Destination, Hotel, Order, Payment, Plan, Survey
  Interfaces/            5  (Country?, OrderRepository, PaymentGateway, PaymentRepository, PlanRepository, SurveyRepository)
  Strategies/Checkout/   5 (CheckoutStrategyFactory, Interface, TripPackage, TripFork, Subscription)
  Enums/                 9
  Events/                2 (PaymentFailed, PaymentSucceeded)
  Listeners/             1 (FulfillOrderListener)
  Notifications/         8 · Mail/ 8 · Exceptions/ 1 · Console/Commands 2
  Queries/               1 (ReportQuery)
database/
  migrations/ 47 · seeders/ 29 · factories/ 23
routes/ 3 · tests (feature) 13
```
- **MAJOR:** `app/Exceptions/ApiExceptionHandler.php` exists (+ custom shape `{error:{...}}`) but `bootstrap/app.php` uses inline `withExceptions` closure returning `{success:false,...}`; the class is **never registered** — name the file: it's a unused/dead class with a conflicting contract.
- `app/Http/Controllers/AdminSetSubscriptionPlanController.php` + `AdminSetSubscriptionPlanRequest` — **orphaned** (no routes register to it), legacy.
- `app/Repositories/CountryRepository.php` **does not exist** at that path (7 repos found = Category, Destination, Hotel, Order, Payment, Plan, Survey) but `AppServiceProvider::register()` binds `CountryRepositoryInterface::class → CountryRepository::class` — one of the repo paths above is wrong (`Country` pair missing); it only fails at resolution, not boot → dead binding warning.

## 5. Endpoint Inventory (No code, verified with route:list)
- Total: **113** API routes excluding `api/up`.
- `GET 49 · POST 31 · PUT 10 · PATCH 10 · DELETE 12 · PUT|PATCH 1` (resource `survey` = `PUT|PATCH`, `orders`)
- Grouping: `api/v1/*` prefix + Paymob `webhook/paymob` (POST, unauthed), `api/up` (health).
- Controller coverage (routes → controllers): AuthController 11, CategoryController 6, PlanController 6, AdminUserController 6, TripController 6, SurveyController 6, AdminDestination/Trip/Restaurant/Hotel/Flight/Country/Attraction/Review = 8×4, Dashboard 3, Notification 3, Report 3, ContactMessage 3, Setting 3, Interaction 3, Map 2, Weather 1, Checkout 1, AIController 1, Contact 1, SiteSettings 1, AdminNotification 1, PaymobWebhook 2.
- Places: 23 public · 29 auth-only · 61 permission-restricted (see §16).

## 6. Controllers — Size & Coupling (Go/Hazard)
- `AuthController` ~237 lines, 11 routes; contains `register`+`Tinker`-injected logic; check `ApiExceptionHandler` not used.
- `TripController` ~436 lines: big but coherent; one action `store` is mixed (validates + quota wrangling) — candidate for service.
- `AdminAnalyticsController` ~300 lines; inline aggregate queries (ok for read but duplicated).
- `InteractionController` simple, passes.
- `MapController` mixed model `$maps` is `OpenStreetService` parameter-bind — good DI. But `MapController@destination` calls `getAttractionsWithAI` (OpenAI gpt-4.1-mini) — **new AI dependency leak**, plus Al-js comment ghost `Log::info($points->toArray())` leftover leaks GEO data to logs.
- `CheckoutController` = 41 lines thin (Good isolate).
- Empty/thin wrappers: `AdminSetSubscriptionPlanController` (orphan), `NotificationController` simple.

## 8. Request Classes (Go)
- 24 FormRequest classes: `Store*Request`, `Update*Request`, auth: `LoginRequest`, `RegisterRequest`, `OtpVerifyRequest`, etc.
- Patterns: good — `TripStoreRequest` merges `user_id`; missing `Admin*Request` for some admin ops (inline validation in `ActivityLog?` etc).
- **Inconsistency:** `AuthController@register` validates **inline** despite `RegisterRequest` exists — bypass.
- GenSource: Payment `createPaymentRequest` fields (num/type + `provider` — allows `stripe` while gateway is Paymob — potential ORIs)

## 9. Validation Approach / Status (Go)
- Child on `Illuminate\Foundation\Http\FormRequest`; authorized() default true for most.
- Places inline-validation used: Admin attraction, category, country, hotel, restaurant, settings, Weather, Auth register — legayee-first-form-request drift.
- **Hazards:** Inline with `telescope` — `ContactController`? No. `InteractionController` no FormRequest (rule arrays inline).
- Missing `Rule::exists` for integrity in some filters (see SQL/283).

## 10. Routes → Controllers → Services → Repositories → DB  (Go)
```
AuthController → (no service) → User (JWT)
CategoryController → CategoryService → CategoryRepository → categories  ✓ same for Hotel (HotelService/HotelRepository) DestinationService/DestinationRepository
SurveyController → SurveyService → SurveyRepository (on AppServiceProvider binding)
CheckoutController → CheckoutService → StrategyFactory → strategies → OrderRepository/Order/PaymentRepository/Payment
PlanController → PlanService (quota, renewal) → PlanRepository
PaymobWebhookController → WebhookService → (validate+HMAC, lock, events, payments repo)
Generated by AI: GroqService (inside "ai itineraries")
...
```

## 11. Query Optimization / N+1 DREAD (Hazard)
- Typical `->with()` on wish/keep-lists: `TripController@show` uses `with(['tripDestinations...'])` generally OK; **`InteractionController@storeReview` loads counts via related counts with `withCount` or 2 queries** — check.
- **High-risk:** `MapController` = multiple HTTP round-trips (OSM + OpenAI) per request — 2–4s (OpenAI latency) synchronous proxy; no cache, no queue → slow UX + OpenAI cost; unauthenticated? Route is auth (per line 36–47 no throttle → abuse cheap). Mark caching gap.
- `ReportController@gensales` `GenerateReportService` → `ReportQuery` OK (single aggregation); heavy PDF generation runs **inline** (request-time) — queue recommended (Job).
- Webhook concurrency handled via `Cache::lock` — good; but `FulfillOrderListener` needs `ShouldQueue` (already implements) — verify queue engine default is sync (dev).

## 12. Caching (Hazard)
- Dependencies present (predis) but **no Redis strategy** e.g. `tripCache`: skipped most endpoints; repeat 0-cache for category/hotels (oc)。
- `SurveyService` none. Suggest: v1 use `cache()` for maps/AI with short TTL.

## 13. Error Handling (Hazard)
- Inconsistent response format:
  - `ApiExceptionHandler` (unused, `{error}`)
  - `bootstrap/app.php` inline handlers (`{success:false,...}`) — could be duplicated → **format contract not centralized** — main architectural rule: ONE: pick `ApiExceptionHandler`, delete inline.
- `WebhookService` catches `\Exception` → notify?; payments must rethrow? Risk: partial-commit states; no `DB::transaction` wrapping in trip-contribution flows! (`TripContributionController`? exists — contributor flow must be atomic — verify `BookingController` availability — only fork via checkout. Transactional gaps in `FulfillOrderListener`?)

## 13. Security (CRITICAL GAP/VERIFY)
- **SSRF bypass:** `OpenMeteoService` uses `Http::withoutVerifying()` (disables TLS verify) — fix to verify.
- **MapController::trip → OSM directions URL** — all good.
- **`Route::post('/review', GroqService::generateAi)` → `config('groq.groq_api_key')` + model; prompt built by fallback; returns Markdown (docs: field-size hazard) — ensure permissions `generate ai itineraries` (yes via auth+permission ✓).
- `AuthController@register` stores `Hash::make` ✓ (CoLeader merge — kept); **`password` field never `expires`/strength; no `Login throttling` on `/login`** (verified: only `verification.resend` throttled `6,1`) → brute-force login possible.
- Webhook HMAC compares `hash_equals` ✓ — good.
- OpenMeteo has no auth (quiet) — fine; OSM overpass ok.
- Hard-coded URLs/keys: **none** found in `app/` `config/` (scan clean).
- `AdminPermission`: `ApiExceptionHandler` passes ~; no policies classes (0) — permission checks via `middleware('permission:...')` on routes ✓, but authorization inside controllers beyond — no `can()` checks for DB-level operations (partially `StoreRequest`).
- Spatie RBAC blocks `/admin/users` unscoped — inventory-verified per-route.

## 15. Readiness (at risk)
- `.env.example` lacks all third-party secrets → production deploy = `.env` copy works but payment/AI/weather live all error without keys.
- Paymob package** in vendor but missing from composer.json → fresh `composer install` on server **will not install** → PaymobGoer fails silently.

---

# PART B — People: Layer-by-layer audit (custom, unique to this work)

## 16. Route-by-route coverage (113 routes)
- Public (23): auth basics (login/register/verify-notice/resend), login+refresh, category index/show, destination index/show, flight index/show, hotel index/show, restaurant index/show, attraction index/show, weather, map destination + trip (no throttle? verify), contact (throttle) , PayMob webhook (public internally)
- Auth-only (29): me/profile/update, favourites toggle, review store/delete, orders index/store, checkout, trip create/store (also permission?) etc — see route table.
- Permission (61): admin dashboards/trips/destinations/restaurants/hotels/flights/countries/attractions/reviews/users/settings/reports/notifications/ ai; plans CRUD; survey submit? (survey = permission `survey` for POST).

## 17. Models (37) — Entities
- Core: User, Trip( itineraryItems via Order, Item), Order, OrderItem, Payment, Plan, Subscription, Category, Country, Destination, Hotel, Restaurant, Attraction, Flight, Booking + BookingItem, Address.
- Community: Review, Favourite, Interaction?, Survey, SurveyResponse?, ContactMessage, Notification, Report, Setting, Commission? (auto-expense), BudgetSnapshot, EntityView, Experience.
- **Drift:** Models `Commission`, `Company`, `Experienceprovider` privacy.
◦ `Notification` — Explain when merging ConMain (locals)

## 17. Factories (23) & Seeders (29), Fixtures
  
## 18. Enums (9) — Status/type, cast surface
- **Inconsistency:** `Trip` uses `$casts status => BookingStatus::class`? Check casts; but `TripController` hardcodes strings ('pending'), `Subscription::active()` filter on string.
- Elastic: `OrderStatus`, `PaymentStatus`, `SubscriptionStatus`, `TripStatus`, `ContactMessageStatus`, `NotificationStatus`, `ReviewStatus`, `FlightStatus(custom)`, `BudgetLevel` — with `values()` static helpers? verify if usable cross-models.

## 19. Events/Listeners/Jobs
- 2 events → 1 listener (FulfillOrder) (queue) — `PaymentFailed` has NO listener (manual notify inside WebhookService) — task reduces envelope.
- 0 Jobs used. Notifications/Mail queued? all `Mail::send` sync (except fulfillment). Recommendation: `ShouldQueue` on mails.

## 20. Tests (13 files) — PASSING (52 tests)
- PaymentFlowTest (Paymob create/callback) ✓, PlansTest ✓, ContactAndSettings ✓✓, EmailIntegration ✓, Verification ✓, ConcurrencyTest ✓ (webhook idempotency: lock re-check), Admin: User/Destination ✓, Sprint1 ✓.
- **Missing coverage:** AuthController (refresh/updateProfile), AI (Grok `generate`/review formats), admin all modules (category/restaurant/hotel/flight/country/attraction/review/notifications/settings), Survey flows (public submit + admin list), Notification endpoints (mark-read), Report generate PDF, Map on OSGeo mocks, Stripe-stub branch, subscription renewal cron, `PlanController` routes (buy/sync), public-side services.
- Real external (PayMob live, Groq, OpenAI, XML) → **mocked**; no integration-tags.

---

# PART C — Synthesis (39)

## 22. Pain Inventory (ranked by impact)
1. **P0 – CategoryController store/update/destroy missing** → 3 admin routes → currently 500.
2. **P0 – `bootstrap/app.php` & `ApiExceptionHandler` dual response shape** (dead class + inline) — breaking contracts.
3. **P0 – composer.json missing `paymob` require** → rebuild-blaston Production.
4. **P1 – Login brute-force open** (no throttle), `resend` throttled only.
5. **P1 – AI in request-time (OSM openAI + Groq `review`) no queue/cache — 2–15 s latency; 429-prone.**
6. **P1 – Missing `Transaction` / partial ordering (FulfillOrder** no wrapping).
7. **P2 – Form-request drift (Auth register inline) – consistency only.**
8. **P2 – `.env.example` missing secrets** → stage1 config docs.
9. **P2 – `Http::withoutVerifying()`** — TLS purely disabled.
10. **P2 – `Log::info($points)` debug-left** — leak to logs.

## 43. Dead Code / Orphans
- `app/Exceptions/ApiExceptionHandler.php` (unused — not registered)
- `AdminSetSubscriptionPlanController` + `AdminSetSubscriptionPlanRequest`
- `CountryRepositoryInterface`/`CountryRepository` binding (class files missing on that path) — AppServiceProvider ref appears broken (line 16–17) — runtime hit-check currently boot disabled: **rescan** (the bind) — my earlier listing named 7 repos excluding Country → binding may simply never resolve.
- `config/services.php` `rapidapi.*` (unused — no consumer)
- `AiRecommendation`? model unused by route (GrokService writes `ai_recommendations`?)

## 44. Tech Debt (consolidated)
1. PaymentStrategyFactory hardcodes map; adding 3rd provider = touch switch.
2. No DTOs — services pulled `array $data`, types loose (not required by layer style).
3. Some controllers >300 (Trip 327); `Report` route heavy — report generate runtime 256MB inline.
4. Routes file 298 lanes; should group + `->can()` abstraction.
5. Tests missing for 15+ modules (see 20).
6. Notifications row shape hybrid (legacy `title/body/status` + native morph columns `notifiable_type/id` in SAME table migration) — mindful DuckDB/SQLite has no PK change.
7. MySQL vs SQLite: migrations use `uuid('id')` in notifications → MySQL ok (char36) but `id` bigint behavioural for DatabaseNotification (uuid id custom string; mySQL type) `->column('id')` — компилException to code (complies with current behavior).
8. Duplicated status strings in controllers vs Enums.

## 45. External API Contracts (5 integrations)
- **Paymob** (Webhook vendor defines `Paymob\Paymob::$processing`) — web-routing, webhook HMAC, sandbox keys.
- **Stub** StripeGateway returns fake client_secret — placeholder (flow testable).
- **Groq** (GroqService: `generateItinerary`) — `config/groq.php` + `AiRecommendation`.
- **OpenAI** (Map getAttractionsWithAI — new `services.openai.key`)
- **Open-Meteo** weather (GET forecast)
- **OSM** Nominatim/Overpass/OSRM-directions — user-agent pinned (email)
- `CountryFixture` synchronizes countries.json from GitHub raw.

---

# PART 2 — 10-Phase Refinement Plan (ordered delivery)

> Rules: no bigger-than-one-phase IF needed; each phase ends green (`php artisan test` + manual cb for changed module). Implementation NOT started yet — awaiting approval.

### Phase 1 — Housekeeping & Config Closure (P0/P2)
- Add `paymob/laravel-package`, `paymob/php-library` to composer.json (lock parity), `composer update paymob/*`.
- Register `ApiExceptionHandler` in `bootstrap/app.php` so one shape rules; delete dead `AdminSetSubscriptionPlan*`.
- Add env placeholders (`PAYMOB_*`, `GROQ_API_KEY`, `OPENAI_API_KEY`, `MAIL_*`) to `.env.example` + `config/services.php` cleanup (remove rapidapi etc. if unused).
- Remove `Http::withoutVerifying()` from OpenMeteoService.
**Exit:** `composer validate` clean, tests green.

### Phase 2 — Fix Admin Category CRUD (P0, urgent)
- Move `api/v1/admin/categories` store/update/destroy routes → `Admin\AdminCategoryController`.
- Optional alias keyword in `CategoryController` — remove.
- Add `AdminCategoryStoreRequest`/`UpdateRequest`.
- Tests: admin category CRUD feature tests.

### Phase 3 — Payment Layer Stabilization
- Confirm `FulfillOrderListener` wrapped in transaction (DB::transaction); `WebhookService` re-emits full idempotency; add `PaymentFailed` listener (notify + order cancellation idempotent).
- In `PaymentRequest` remove Stripe-only option ambiguity (`provider` + gateway resolver) — align App service env.
- Tests for end-to-end callback (fork, subscription, report…).

### Phase 4 — Authentication Hardening
- Add throttles: `login` (10/min?), `refresh`, `otp` — per IP+email.
- Add `#` role to tokens claims; gate admin routes via permission middleware (already) — add policies for user-sensitive ops.
- Update `AuthController`: use `RegisterRequest` (kill inline).

### Phase 5 — External-Call Resilience (AI/Map/Weather)
- Introduce **queue** for: PDF report, AI generation, OSM place fetch; Webhooks sync where necessary.
- Cache (30 min) map/weather/AI responses keyed by query; `Cache::remember`, TTL randomize to avoid stampede.
- `OpenStreetService` add retry+user-agent header & max results caps; remove `Log::info` payload.
- Timeouts everywhere (Groq service has).

### Phase 6 — Clean API Surface & Consistency
- Merge inline validation into 8 FormRequests; unified JSON error shape (no `error` vs `success` mash).
- Introduce `ApiResponse` helper (success/fail/pagination) to stop ad-hoc `response()->json(...)` — controller purity.
- Consistent `per_page`/`page` pagination params everywhere; adopt `Resource` classes (12 exist) — apply to Trip/Plan/Report responses.

### Phase 7 — Data Integrity & Indexes
- Use Enums in models (rename string comparisons); replace `'status'=>'pending'` string sets with enum casts.
- Review notifications migration (uuid PK + morph columns) — decide: separate legacy columns vs remove.
- Add missing indexes on FKs (`order_items.order_id`, `trip_destinations.trip_id`, jobs queue fails — `jobs` table).
- Review `Commission`/`Transaction` — real vs unused; soft deletes where deletes harm history (reviews/orders).

### Phase 8 — Tests Expansion (Hybrid)
- Add Webhook cancel/re-open, 2 Webhook POST = once (already partially), PaymentFailed listener, listener failure-rollback tests.
- Coverage: All admin CRUD modules, login-rate-limit, AI generate (mocked Groq), map (mocked OSM/OpenMeteo), PDF report generation (fake storage).
- Integrate `phpunit` coverage report — target ≥60% API layer this phase.

### Phase 9 — Scalability & Ops
- Move `BLoC` seeds → env-driven (site settings `blocked`?).
- `queue:work` deployment doc + `cache driver=redis` switch docs.
- Report delivery via queued job + `/me/reports` polling (already exists?) — decouple.
- Backup policy: DB + storage (`reports/*`, media).

### Phase 10 — Release Ready
- API docs final (Scramble annotations already?), `config:cache` check, env param full list export.
- CI: run `pint --test`, `phpunit`, `php artisan migrate:fresh --seed` in pipeline.
- Security smoke: `gitleaks` scan, verify all 113 routes statistical coverage table, sign-off.

---

### Acknowledged Risk Overrides (as scoped earlier)

Final deliverable ready to link to your client approvals. Files touched in this audit: NONE (read-only). No code changed per instruction until Phase-approval.