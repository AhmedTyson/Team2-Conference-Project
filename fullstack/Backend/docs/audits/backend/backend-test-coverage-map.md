# Backend — Test Coverage Map

46 test files (43 Feature + 2 Unit + TestCase base). Runner: `php artisan test` / `composer test`. Suite: **257 passed, 900 assertions, 0 failures, ~37s**. DB: sqlite (phpunit.xml).

| Domain | Feature | Test File(s) | Type | Coverage Evidence | Missing Coverage |
|---|---|---|---|---|---|
| Account | Auth throttles + JWT role claims | AuthThrottleTest | Feature | login/register/forgot/refresh limit enforcement | — |
| Account | Blocked users | BlockedUserTest | Feature | blocked login/token reject, reactivation, invalid-token passthrough | — |
| Account | RBAC role fillable lock | RoleMassAssignmentTest | Feature | Role mass-assignment guard + permission sync | — |
| Account | Admin user CRUD | UserTest | Feature | create/read/update/block/activate + denial | — |
| Account | Email verification | VerificationTest | Feature | resend + signed verify link, invalid hash | — |
| Catalog | Admin restore per resource | AdminRestoreTest | Feature | restore flows, authz, edge cases | — |
| Catalog | Trashed listing | AdminTrashedRecordsTest | Feature | soft vs hard delete, filter isolation | — |
| Catalog | Attractions/Categories/Countries/Destinations/Hotels/Restaurants admin | AttractionTest, CategoryTest, CountryTest, DestinationTest, HotelTest, RestaurantTest | Feature | CRUD + denial + validation contracts; destination auto-coordinates | **No FlightTest** — flight admin CRUD untested |
| Commerce | Agency pagination | AdminAgencyPaginationTest | Feature | admin agency index paging | — |
| Commerce | Agency completion/state machine | AgencyAssignmentCompletionTest, AgencyAssignmentStateTransitionTest | Feature | own-view, cancel, illegal transitions | — |
| Commerce | Full agency + flags | AgencyTest | Feature | request→approve→build trip; flag report/review | — |
| Commerce | Checkout abuse | CheckoutAbuseTest | Feature | rate limit, gateway-call bounding, idempotency, server-side price | — |
| Commerce | Webhook concurrency | ConcurrencyTest | Feature | duplicate webhook prevention | — |
| Commerce | Order lifecycle | OrderLifecycleTest | Feature | 30-min expiry, 24h grace, terminal states, races | — |
| Commerce | Checkout→fulfillment | PaymentFlowTest | Feature | package/fork/subscription fulfillment + rollback + idempotency | — |
| Commerce | Payment sensitive data | PaymentSensitiveDataTest | Feature | PAN never persisted, encrypted payload, no leaks | — |
| Commerce | Paymob timeouts | PaymobTimeoutTest | Feature | cURL timeouts + gateway config | — |
| Commerce | Plans/subscriptions | PlansTest, SubscriptionExpiryTest, SubscriptionMigrationTest, SubscriptionUniquenessTest | Feature + Database | set/list/subscribe; expiry/quota; command idempotency; one-active-subscription races | **StripeGateway untested** (stub) |
| Email | Mailables per event | EmailIntegrationTest | Feature | mailables build | — |
| System | Contact + settings | ContactAndSettingsTest | Feature | public contact, admin contact/settings mgmt | — |
| System | Maintenance mode | MaintenanceModeTest | Feature | 503/200 | — |
| System | Reports | ReportTest | Feature | PDF gen/download, /me/reports | Excel export path untested |
| System | Surveys | SurveyValidationTest | Feature | CRUD + enum validation + ownership | — |
| System | Weather | WeatherCacheTest | Feature | per-coord cache, failure not cached | — |
| Trips | AI features | AiFeatureTest, AiQuotaCacheHitTest, AiRateLimitTest | Feature | quota consume/restore, cache-hit no-consume, per-user limits | — |
| Trips | Fork auth | ForkAuthorizationTest | Feature | private/public fork checkout + fulfillment rules | — |
| Trips | Maps | MapCacheTest, MapDestinationAbuseTest | Feature | external-call-once, throttle, no-mutation GET, backfill job, nominatim timeout | OSRM/Overpass timeout untested |
| Trips | Access control | TripAccessControlTest | Feature | owner-only review/map | — |
| Trips | Planner attach/detach | TripAttachDetachTest | Feature | validation, duplicates, missing items | — |
| Smoke | Sprint1 + stock | Sprint1IntegrationTest, Sprint1UnitTest, ExampleTest (Feature+Unit) | Smoke | legacy endpoint/model smoke | LEGACY / UNUSED value |

## Coverage gaps (verified)

1. **Flight admin CRUD** — no dedicated test file (other catalog resources covered).
2. **Excel report generation** — only PDF path tested (ReportTest).
3. **StripeGateway** — no tests (stub).
4. **AI field-name mismatch** (`no_of_days` vs `number_of_days`) — tests send `number_of_*`, service reads `no_of_*`; tests pass but don't assert prompt content → gap undetected.
5. **Controllers without tests**: MapController@destination AI-leg error paths, ConciergeController, NotificationController read flows, mail-preview route.
6. No **Unit** tests for services/repositories (only 2 legacy Unit files).
7. No coverage for scheduler invocations beyond SubscriptionMigrationTest command run.