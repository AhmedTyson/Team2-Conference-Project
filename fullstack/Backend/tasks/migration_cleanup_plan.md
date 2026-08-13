# Migration Consolidation Plan

## Goal
Flatten all migration history into final current database schema.

## Current Status
- ~~44 migration files~~ → **36 files** (consolidated ✅)
- ✅ `php artisan migrate:fresh --seed` runs clean from scratch
- ✅ Full test suite green: 257 passed (900 assertions)
- Completed: 2026-08-13

## Issues Identified & Resolved

### Deleted (merged into base create migrations)
1. `2026_08_04_103834_add_is_active_to_users_table.php` → `create_users_table` (is_active)
2. `2026_08_06_060002_add_ai_quota_to_users_table.php` → `create_users_table` (ai_generations_count, ai_reset_at)
3. `2026_08_09_221249_add_price_cents_to_restaurants_table.php` → `create_restaurants_table`
4. `2026_08_07_235749_alter_payments_table_for_orders.php` → `create_payments_table` (order_id)
5. `2026_08_07_235750_alter_trips_table_for_forks.php` → `create_trips_table` (parent_trip_id, original_trip_id, is_fork, source_version_id)
6. `2026_08_08_134642_alter_notifications_table_for_native_hybrid.php` → `create_notifications_table`
7. `2026_08_08_150000_add_status_to_reports_table.php` → `create_reports_table`
8. `2026_08_10_000000_add_deleted_at_to_soft_delete_tables.php` → `softDeletes()` in each of the 10 create migrations
9. `2026_08_12_000001_add_format_to_reports_table.php` → `create_reports_table`
10. `2026_08_12_000001_add_unique_constraint_to_orders_idempotency_key.php` → `create_orders_table`
11. `2026_08_11_000002_add_is_public_to_trips_table.php` → `create_trips_table`
12. `2026_08_12_232304_add_expires_at_to_password_reset_tokens_table.php` → `create_users_table` (password_reset_tokens.expires_at + unique token)
13. `2026_08_11_000001_phase2_payment_security.php` → `create_payments_table` (client_secret, checkout_url, raw_payload as text); data backfills are no-ops on fresh DB

### Dropped domain (tables removed from final schema, not sequential drops)
- Deleted 8 create migrations + the drop migration: experience_providers, experiences, companies, bookings, booking_items, transactions, commissions, entity_views
- `payments.booking_id` removed, `trips.confirmation_code` added (was `bookings.confirmation_code`)

### Follow-up fixes (pre-existing failures, not migration-caused)
- `FulfillOrderListener` generated codes against dropped `bookings` table → now `trips`
- `CheckoutService` never called `findReusableCheckout` → idempotency-key reuse now works (SEC-08)
- `PaymentSensitiveDataTest::p2` stale (expected last-4 stored; Phase-1 decision = store nothing) → asserts no card_pan column
- `PaymentFlowTest` stale listener instantiation → passes ConfirmationCodeService

## Files Kept (Laravel Defaults / Infrastructure)
1. `0001_01_01_000001_create_cache_table.php`
2. `0001_01_01_000002_create_jobs_table.php`
3. `2026_07_30_185256_create_telescope_entries_table.php`
4. `2026_08_01_112147_create_personal_access_tokens_table.php`
5. `2026_08_02_075042_create_permission_tables.php`

## Verification
- ✅ `php artisan migrate:fresh --seed` (36 migrations + 20 seeders, no errors)
- ✅ `php artisan test` → 257 passed (900 assertions)
- ✅ payments: no card columns, client_secret/checkout_url/raw_payload(text) present
- ✅ trips: is_public, confirmation_code, fork columns merged
- ✅ password_reset_tokens: expires_at + unique token merged
