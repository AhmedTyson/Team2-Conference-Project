# Master Audit Checklist

Consolidated backend map + findings. Repo: `Team2-Conference-Project` (Laravel 13, PHP ^8.5, JWT auth, spatie permissions, vanilla-JS frontend OUT OF SCOPE). Generated during documentation phase; verify before trusting (docs drift).

---

## 1. Routes map (`routes/api.php`)

| Range | Section | Notes |
|---|---|---|
| 56-92 | ACCOUNT | register/login throttled, signed-URL email verify, `auth:api` group (user/refresh/logout/profile), admin users |
| 94-193 | CATALOG | public v1 (countries/destinations/hotels/flights/attractions/restaurants/categories), admin CRUD per-resource |
| 195-253 | TRIPS | maps, planner attach/detach, trip show, concierge, interactions (favourites/reviews), AI generate, admin trips/reviews |
| 255-294 | COMMERCE | plans, checkout, Paymob webhook (unauthenticated + HMAC), analytics |
| 296-380 | SYSTEM | contacts/weather, surveys, dashboard, notifications, reports, agency + flags |

Key structure: `auth:api` + `permission:*` per admin route; `role:admin|super_admin` on notifications/reports/agency/flags; `role:agency` on agency endpoints. `POST api/review` at :233-234 routes DIRECTLY to `[GroqService::class, 'generateAi']` (no controller).

## 2. Auth & middleware

- Guard: `api` → `jwt` driver (tymon/jwt-auth), ttl 60 min, refresh_ttl 20160 min (14d), HS256, blacklist enabled.
- `EnsureUserIsActive`: bearer-token check, blocks `is_active=false` → 403 `account_blocked`; passes invalid tokens through (real auth error surfaces later).
- `bootstrap/app.php`: api group = PreventRequestsDuringMaintenance, SubstituteBindings, EnsureUserIsActive. NO global `throttle:api`.
- Rate limiters (AppServiceProvider): login 5/min, register 5/min, ai/day (config default 500/user), maps 10/min IP, checkout 5/min, password_reset 3/10min, refresh 15/min, resend 6/min, api_authenticated 60/min — **api_authenticated defined but unused by any route**.
- Spatie: Role model overridden (`guard api`), Permission default spatie model.

## 3. Domain inventory

### 3.1 Services (non-Trips)
| Service | Core methods | External |
|---|---|---|
| GroqService | enhance, generateAi, review | Groq chat, 60-min cache, quota consume/restore |
| ConciergeService | getTripContext, ask | Groq, trip-aware |
| OpenMeteoService | getWeather | open-meteo, 5s timeout |
| CheckoutService | processCheckout | strategy factory → Paymob, idempotency_key, confirmation_code |
| WebhookService | verify + fulfill | HMAC, cache lock, 24h grace deadline, events |
| PaymobGateway / PaymobClient | createIntention, verifyWebhook | SDK + raw cURL (30s/5s timeouts) |
| **StripeGateway** | **createIntention, verifyWebhook** | **STUB: hardcoded `pi_example_secret`/`cs_test_example`; verifyWebhook returns true always** |
| PlanService | CRUD, subscribe/upgrade/cancel, syncAiQuota | — |
| PriceCalculatorService | subscription/fork/package price | — |
| AgencyAssignmentService | request/list/cancel/approves/buildTrip, 15/page | — |
| Catalog *Service (8) | thin repo-wrapper CRUD | — |
| Fixture*Service (5) | sync() external fixtures | — |
| Account\UserService | admin list/show/store/update/setActive/setBlock | — |
| System (Survey/Setting/Flag/ContactMessage/GenerateReport/Excel) | CRUD, settings patch, dompdf/openspout | — |
| ConfirmationCodeService | generateUniqueCode 8-char | — |

### 3.2 Jobs / Events / Mail / Notifications
- Jobs: GeocodeDestinationJob, GenerateReportJob.
- Events: PaymentSucceeded, PaymentFailed, Commerce\{AgencyAssignmentAdminApproved, Approved, Declined}.
- Listeners: FulfillOrderListener (queued; package/fork/subscription), HandlePaymentFailed.
- Mailables (9): Welcome, TripBooked, PaymentSuccess, PaymentFailed, TripForked, SubscriptionActivated, ReviewPublished, ReviewFlagged, BookingCancelled.
- Notifications (9): AppNotification base (database+mail, 5min WithoutOverlapping); PaymentFailedNotification mail-only.

### 3.3 Strategies / Policies / Queries
- Checkout strategies (4): TripPackage, TripFork, Subscription + Factory.
- Policies: TripPolicy (view/fork ownership), AgencyAssignmentPolicy, FlagPolicy.
- Queries\ReportQuery: 15+ analytics queries (KPIs, revenue trends, peaks).

### 3.4 Models — orphans & dead references
| Model | Problem |
|---|---|
| EntityView, Experience, ExperienceProvider, Company | **No matching migrations** (no tables) — dead code or future feature |
| Payment::booking() | references `Booking` model — **class absent** |
| Payment | append-only (UPDATED_AT null), raw_payload encrypted — good |
| Setting | SITE_KEYS whitelist + public cache — good |
| User | hashed casts, JWTSubject, HasRoles(api) — good |

36 models, 36 migrations. Soft-delete tables: surveys, countries, categories, destinations, restaurants, trips, flights, hotels, attractions, reviews. Morph tables: favourites, itinerary_items, reviews, trip_items, addresses, order_items, flags, notifications, personal_access_tokens (sanctum unused).

### 3.5 Requests — dead/empty
| Request | Problem |
|---|---|
| AdminSetSubscriptionPlanRequest | `authorize() = false` → always 403, dead |
| SurveyStoreRequest | `authorize() true`, rules EMPTY — accepts anything |
| GroqService direct route | `POST api/review` bypasses FormRequest layer entirely |

All other requests: authorize()=true (JWT middleware guards route), none use `authenticate()`.

## 4. Security findings

| # | Severity | Finding |
|---|---|---|
| 1 | HIGH | **GroqService reads `no_of_days`/`no_of_travelers`; AiTripRequest validates `number_of_days`/`number_of_travelers`; tests send `number_of_*`** → prompt gets nulls, cache key near-constant. Fix: rename reads. |
| 2 | HIGH | StripeGateway stub: hardcoded fake secrets, `verifyWebhook` always true — never ship to prod path. |
| 3 | MED | CORS default `allowed_origins=*` + supports_credentials=false. Tighten per-env. |
| 4 | MED | No global `throttle:api`; per-route only. `api_authenticated` limiter unused. |
| 5 | LOW | Sanctum `personal_access_tokens` migration present but unused (jwt active) — remove or ignore. |
| 6 | LOW | Telescope migration shipped in default set (`TELESCOPE_ENABLED=false` default, ok). |
| 7 | LOW | Orphan models + Booking dead relation — dead code confusion. |
| 8 | LOW | `POST api/review` controller-less route — bypasses request validation; validation lives inside service. |
| 9 | INFO | JWT HS256 ttl 60 — fine; blacklist on. |
| 10 | INFO | Payment append-only + encrypted payload — compliant. |

## 5. Schedule & queue

- `routes/console.php`: orders:expire-stale (everyMinute, pending >30min), subscriptions:expire-stale (everyMinute, renews_at passed), password:expire-tokens (daily).
- Commands: SyncFixtures, SyncCities, SeedFresh, ExportPostman, 3 expire commands.
- Queue: database driver, retry_after 90. No withSchedule in bootstrap (schedule defined in routes/console.php — fine for Laravel 11+).

## 6. Testing (46 files, 43 Feature + 2 Unit + base)

Full coverage: auth throttles, blocked users, catalog CRUD/restore/trashed, commerce (abuse, concurrency, lifecycle, payment flow, sensitive data, timeout, plans, subscriptions), surveys, reports, weather cache, trips (AI, quota, rate limit, fork auth, map cache/abuse, access control, attach/detach), email integration, maintenance mode, sprint1 smoke.

Run: `composer test` or `php artisan test`.

## 7. Config deltas

- ai.php: rate_limit_per_day 500. paymob.php: timeouts 30/5. jwt.php: ttl 60/refresh 20160/HS256/blacklist. cache: database, prefix `threedos_`. queue: database. services.php: rapidapi/openai/open-meteo/osrm custom keys. .env.example: PAYMOB_*, GROQ_API_KEY, OPENAI_API_KEY, SITE_FORK_PRICE_CENTS=50000, PLATFORM_COMMISSION_RATE=0.05, CORS_ALLOWED_ORIGINS=*.

## 8. Action items (from findings)

1. Fix field-name mismatch (#1) — rename GroqService reads or align request/tests.
2. Replace StripeGateway stub with real impl or remove (#2).
3. Tighten CORS per env (#3).
4. Wire api_authenticated limiter or drop (#4).
5. Decide fate of orphan models + Booking relation (#7).
6. Add controller + FormRequest for direct GroqService route (#8).
7. Remove dead AdminSetSubscriptionPlanRequest, fix SurveyStoreRequest (#3.5).
