# Backend — Authentication & Security Inventory

## Authentication

| Mechanism | Detail | Config / File |
|---|---|---|
| Guard | `api` — driver `jwt` (tymon/jwt-auth), provider users → `App\Models\Account\User` | config/auth.php:46-49 |
| Tokens | HS256, TTL 60 min, refresh TTL 20160 min (14 days), blacklist enabled, lock_subject | config/jwt.php |
| Login | `POST api/login` → JWT w/ spatie role claims; throttled `throttle:login` (5/min ip+email) | AuthController, AppServiceProvider limiter |
| Register | `POST api/register` (name/email/phone/password min 8 confirmed), throttle:register | RegisterRequest |
| Logout | Blacklists current token | AuthController@logout |
| Refresh | `POST api/refresh`, throttle:refresh_token (15/min) | AuthController |
| Password reset | forgot (throttle 3/10min) + reset (5/1min), token table, daily `password:expire-tokens` sweep | ForgotPasswordRequest, ResetPasswordRequest |
| Email verification | Signed URL `api/email/verify/{id}/{hash}` (no auth), resend throttle 6/min | VerificationTest |
| Blocked users | `EnsureUserIsActive` middleware: bearer token lookup; `is_active=false` → 403 `{type: account_blocked}`; invalid/expired tokens pass through to JWT layer | Middleware/EnsureUserIsActive |
| Rate limiters (AppServiceProvider) | login 5/min (ip+email), register 5/min, ai per-day (500 default, per user), maps 10/min (IP), checkout 5/min, password_reset 3/10min, password_reset_strong 5/min, refresh_token 15/min, resend_email 6/min, api_authenticated 60/min (**defined, unused**) | AppServiceProvider:86-136 |

## Authorization

| Layer | Implementation | What it protects |
|---|---|---|
| Permission middleware | `permission:*` on admin routes (manage users/categories/countries/destinations/flights/hotels/attractions/restaurants/trips/reviews/plans/contacts/settings, get plans, subscribe, upgrade, cancel, view subscription, analytics, generate ai itineraries) | Admin CRUD + plan + AI routes |
| Role middleware | `role:admin|super_admin` (notifications/reports/agency/flags), `role:agency` (agency endpoints) | System/admin surfaces |
| Policies | `TripPolicy` (view/update/delete/fork — ownership + is_public), `AgencyAssignmentPolicy` (view/approve/respondAsAgency/cancel), `FlagPolicy` (view/createForAssignment/review/update/delete) | Trip, agency assignments, flags |
| Owner checks in controllers | `InteractionController@destroyReview` (user_id match → 403), `ReviewController` ownership | Reviews |
| Route-level | All mutating routes inside `auth:api` groups; maps trip route authorized via `$this->authorize('view', $trip)` | Trips, maps |
| Denial response | `ApiExceptionHandler` maps AccessDenied/Authorization → typed JSON (`type: authorization`, 403); authentication errors → 401; validation → 422 | Global |

## Security Features (verified + test evidence)

| Security Feature | Implementation | File(s) | Verified? | Test Evidence |
|---|---|---|---|---|
| Sensitive payment data protection | No PAN columns; append-only payments; `raw_payload` encrypted cast | Payment model, payments migration | YES | PaymentSensitiveDataTest |
| Webhook HMAC verification | HMAC compare before processing; cache lock; 24h grace deadline | WebhookService, PaymobGateway | YES | ConcurrencyTest, OrderLifecycleTest |
| Idempotency | `idempotency_key` unique index; gateway-call bounding | orders migration, CheckoutService | YES | CheckoutAbuseTest |
| Server-side pricing (anti-tamper) | `PriceCalculatorService` computes instead of trusting client | PriceCalculatorService, strategies | YES | CheckoutAbuseTest |
| Rate limiting | 10 named limiters + inline throttle rules | AppServiceProvider, routes | YES | AuthThrottleTest, MapDestinationAbuseTest, CheckoutAbuseTest, AiRateLimitTest |
| IDOR protection | Ownership policies + owner checks | 3 policies + controllers | YES | TripAccessControlTest, AgencyAssignmentCompletionTest |
| Blocked-user enforcement | Middleware 403 | EnsureUserIsActive | YES | BlockedUserTest |
| Input validation | 41 Form Requests; enum rules (Rule::enum) | Requests/ | YES | HotelTest, SurveyValidationTest, RestaurantTest |
| External timeout protection | Paymob 30s/5s, Open-Meteo 5s, Nominatim explicit timeout | PaymobClient, OpenMeteoService, OpenStreetService | YES | PaymobTimeoutTest, MapDestinationAbuseTest |
| Centralized error handling | Typed JSON for 9 exception classes | ApiExceptionHandler | YES | code inspection |
| CORS | `CORS_ALLOWED_ORIGINS=*` default, supports_credentials=false | config/cors.php | YES (findings: tighten per env) | code inspection |
| Maintenance mode | 503 handling | PreventRequestsDuringMaintenance | YES | MaintenanceModeTest |
| Encrypted env/secrets | JWT_SECRET, PAYMOB_*, GROQ_API_KEY via env; JWT_SECRET generated in composer `setup` | .env.example, composer.json | YES | — |

## Gaps / Findings

1. **CORS wildcard default** (`*`) — acceptable for public API; tighten when frontend domain fixed.
2. **No global `throttle:api`** — only per-route; `api_authenticated` limiter unused.
3. **Sanctum migration ships** but guard unused (dead surface — confusion risk).
4. **StripeGateway stub** — `verifyWebhook` always true; harmless as gateway is not wired, but dangerous if wired later.
5. **GroqService field mismatch** — reads `no_of_days`/`no_of_travelers` while validation/tests use `number_of_*` (nulls in prompt; cache key collision).
6. **Debug mode ENABLED** in local env config — standard dev posture; confirm disabled in prod.