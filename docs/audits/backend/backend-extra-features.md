# Backend — Extra Features

Functionality implemented beyond the case-study requirements (`Case_Study_For_ThreeDOS.md`). All verified from code.

| Extra Feature | Domain | What It Does | Files | Routes | Why It Is Extra | Status |
|---|---|---|---|---|---|---|
| JWT authentication | Security | Stateless token auth (tymon/jwt-auth, HS256, ttl 60min, refresh 14d, blacklist) | config/auth.php, config/jwt.php, AuthController | login/register/refresh/logout | Case study asked generic "Laravel Authentication", not JWT API auth | IMPLEMENTED |
| Blocked-user enforcement | Security | `is_active=false` users get 403 `account_blocked` via middleware | EnsureUserIsActive | global api group | Account status concept beyond case study | IMPLEMENTED |
| AI quota system | AI | Per-user daily AI generation quota (consume/restore, config default 500/day) | AiUsageService, config/ai.php, users.ai_generations_count | AI routes | Quota management not mentioned in case study | IMPLEMENTED |
| AI trip review / enhance | AI | AI reviews and refines trips (Groq) | GroqService@enhance/@review | service-level | Extra AI capability beyond "recommendations" | IMPLEMENTED |
| Concierge AI assistant | AI | Trip-aware chat assistant (Groq, trip JSON context) | ConciergeService, ConciergeController | concierge route | Not in case study | IMPLEMENTED |
| AI cache + cache-hit quota behavior | AI/Perf | 60-min cache per itinerary; cache hit does not consume quota | GroqService Cache::remember | AI routes | Caching AI outputs | IMPLEMENTED |
| Full payment system (Paymob) | Commerce | Payment intentions, checkout URL, encrypted payload, append-only payments | CheckoutService, PaymobGateway, Payment model | checkout, webhook, callback | Case study: "revenue statistics (if booking feature is added)" — optional, actually built | IMPLEMENTED |
| Webhook processing (HMAC) | Commerce/Security | HMAC-verified Paymob webhook, cache-lock dedup, 24h grace deadline | WebhookService, PaymobGateway@verifyWebhook | POST api/v1/paymob/webhook | Webhooks not in case study | IMPLEMENTED |
| Idempotency | Commerce/Security | idempotency_key unique on orders; gateway-call bounding | Order model, CheckoutService, InitiateCheckoutRequest | checkout | Anti-double-charge | IMPLEMENTED |
| Order lifecycle + expiry sweep | Commerce | pending>30min → expired via scheduler; terminal states | ExpireStaleOrders, Order model | scheduler everyMinute | Order management beyond case study | IMPLEMENTED |
| Subscription plans | Commerce | Tiers w/ ai_quota_monthly, billing cycles, features json | Plan model, PlanService | plans routes | Plans/subscriptions extra | IMPLEMENTED |
| Subscriptions + renewal/expiry | Commerce | One active subscription (partial unique), renews_at sweep, upgrade/cancel | Subscription model, ExpireStaleSubscriptions, PlanService | subscriptions routes + scheduler | Subscription system extra | IMPLEMENTED |
| Trip forking | Trips/Commerce | Copy trip (private fork via paid checkout; public fork free), owner notification | TripForkService, TripPolicy, TripForkedNotification, trip fork strategy | fork + checkout routes | Not in case study | IMPLEMENTED |
| Public/private trip visibility | Trips/Security | is_public flag gates fork/checkout | Trip model, TripPolicy | fork/checkout | Extra control | IMPLEMENTED |
| Trip planner attach/detach | Trips | Attach/detach hotels/flights/attractions/restaurants to trips | planner routes, TripAttachDetachTest | api/planner/* | Extra trip management | IMPLEMENTED |
| Agency workflow | Agency | Assignment request→admin approve→agency approve→build trip; decline/cancel paths; pagination | AgencyAssignmentService, AgencyAssignmentPolicy, 3 events | api/agency*, admin agency routes | Agencies not in case study | IMPLEMENTED |
| Moderation flags | System/Security | Report users/entities; admin approve/decline; flagged-file review | FlagService, FlagPolicy, StoreFlagRequest | api/flags*, admin flags | Moderation beyond case study | IMPLEMENTED |
| Reports (PDF/Excel) | System | Admin report generation (dompdf), Excel export (openspout), queued job, download | GenerateReportService, GenerateReportExcelService, GenerateReportJob, Report model | api/reports*, admin reports | Reporting system extra | IMPLEMENTED |
| Analytics backend (query set) | System | 15+ KPI/revenue/destination/peak queries | ReportQuery | api/v1/analytics* | Dashboards beyond case study charts | IMPLEMENTED |
| User points | Gamification | Points per action, metadata, per-user index | UserPoint model/migration/seeder | — | Points system extra | IMPLEMENTED |
| Budget snapshots | Trips | Recorded trip budget breakdowns | BudgetSnapshot model/migration | — | Extra trip tracking | IMPLEMENTED |
| Trip contributions | Trips | Contributor name/amount/message per trip | TripContribution model/migration | — | Collaboration extra | IMPLEMENTED |
| OSRM directions API | Maps | Waypoint routing for trips | OpenStreetService@getDirections | api/v1/maps/trip/{trip} | Route directions extra | IMPLEMENTED |
| Background geocode job | Maps/Async | Nominatim backfill of missing destination coords | GeocodeDestinationJob | queued | Async backfill extra | IMPLEMENTED |
| Open-Meteo weather | System | External weather with per-coord cache + timeout | OpenMeteoService, WeatherController | GET api/weather | Provider swap + caching beyond case study | IMPLEMENTED |
| Maintenance mode 503 | System/Infra | Graceful 503 behavior + test | PreventRequestsDuringMaintenance, MaintenanceModeTest | global | Ops capability extra | IMPLEMENTED |
| Notification system (DB+mail) | System | 9 notification types, channels database+mail, 5-min idempotency | AppNotification, Notifications/* | api/notifications* | Notification infra beyond basic mail | IMPLEMENTED |
| Scramble API documentation | Dev | OpenAPI UI + JSON behind restricted access | Dedoc\Scramble | docs/api, docs/api.json | Docs tooling extra | IMPLEMENTED |
| Telescope | Dev | Debug toolbar (default off) | laravel/telescope | /telescope | Dev tool extra | IMPLEMENTED |
| Mail preview endpoint | Dev | Render mailables by type | mail-preview route | GET mail-preview/{type} | Mail dev tool extra | IMPLEMENTED |
| Fixture sync commands | Infra | Sync countries/cities(hotels/restaurants/flights) from external sources | SyncFixtures, SyncCities, Fixture*Service, ExportPostman | CLI | Data tooling extra | IMPLEMENTED |
| Export Postman command | Dev | Generate Postman collection | ExportPostman | CLI | Tooling extra | IMPLEMENTED |
| Confirmation codes | Commerce | 8-char unique codes for orders | ConfirmationCodeService | checkout | Extra order UX | IMPLEMENTED |
| RapidAPI config surface | Integration | rapidapi host keys in config (no verified call path) | config/services.php | — | Config-only extra, unverified | UNVERIFIED |
| Stripe stub gateway | Commerce | Interface-swap stub (fake secrets, verifyWebhook=true) | StripeGateway | — | Extra gateway placeholder | LEGACY / UNUSED |
| Sanctum personal access tokens migration | Infra | Stock table migration, unused | 2026_08_01_112147 | — | Unused infra leftover | LEGACY / UNUSED |