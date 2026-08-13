# Backend — Async / Background Processing Inventory

## Queue configuration

- Driver: `database` (config/queue.php:16), connection retry_after 90s, after_commit false. Redis block present but unconfigured.
- Consumer expected via `queue:listen --tries=1 --timeout=0` (composer `dev` script).

## Jobs (2)

| Job | Trigger | Purpose | Queue | Retry | Side Effects |
|---|---|---|---|---|---|
| GeocodeDestinationJob | MapController@destination when coords missing | Nominatim backfill of destination lat/lng | default (database) | default | Updates destinations row; no-op if already geocoded |
| GenerateReportJob | Report generation request | Runs GenerateReportService@fillReport (dompdf) | default | default | Writes reports file + row, status transitions |

## Events / Listeners (5 events, 2 listeners)

| Event | Triggered By | Listener | Queue | Purpose / Side Effects |
|---|---|---|---|---|
| PaymentSucceeded | WebhookService after verified webhook | FulfillOrderListener | queued | Fullfill trip package / fork / subscription; rollback on failure; order→fulfilled |
| PaymentFailed | WebhookService | HandlePaymentFailed | queued | Order→failed; PaymentFailedNotification (mail-only) |
| AgencyAssignmentAdminApproved | Agency service admin approve | — | — | Workflow event (no listener) |
| AgencyAssignmentApproved | Agency approve | — | — | Workflow event (no listener) |
| AgencyAssignmentDeclined | Agency decline | — | — | Workflow event (no listener) |

## Notifications / Mail async behavior

- `AppNotification` base: channels `database` + `mail`; 5-minute `WithoutOverlapping` idempotency.
- 9 concrete notifications (Welcome, TripBooked, TripForked, PaymentSucceeded, PaymentFailed [mail-only], SubscriptionActivated, ReviewPublished, ReviewFlagged, BookingCancelled) + 9 mailables.
- Mail driver: `log` (dev).

## Scheduler (routes/console.php)

| Command | Signature | Schedule | Purpose |
|---|---|---|---|
| ExpireStaleOrders | orders:expire-stale | everyMinute | pending orders >30min → expired |
| ExpireStaleSubscriptions | subscriptions:expire-stale | everyMinute | renews_at passed → expired; quota block |
| ExpirePasswordTokens | password:expire-tokens | daily | purge stale reset tokens |

Note: schedule registered in `routes/console.php` (Laravel 11+ style); no `withSchedule` in bootstrap — correct modern arrangement. **Scheduler must run externally** (`php artisan schedule:work` / cron) — not verified as running in env.

## Other async surfaces

- `AfterCommit` not used; `Queueable` used by jobs + listeners.
- No retry/timeout overrides beyond queue defaults.
- No `shouldQueue` mailables — mailables sent inline within listeners (default).