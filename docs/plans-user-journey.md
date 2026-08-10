# Plans & Subscriptions — User Journey & Postman Test Guide

**Branch:** `feature/paymob-payments`
**Spec:** S5 Plans & Booking Flow page (money layer)
**Status:** 🟢 IMPLEMENTED (payment wiring + caching intentionally deferred)

## Scope

Plans gate AI quota (F2) and unlock premium features. Subscription rows feed the future payment task;
every plan change is prorated server-side. **Not included (next tasks):** Paymob charge execution,
Redis caching of the plans list.

## Stack

- `App\Http\Controllers\PlanController` — 6 endpoints
- `App\Services\PlanService` → `App\Interfaces\PlanRepositoryInterface` → `App\Repositories\PlanRepository` (bound in `AppServiceProvider`)
- `App\Models\Plan`, `App\Models\Subscription`
- Tables: `plans`, `subscriptions` + `users.ai_generations_count` / `users.ai_reset_at`
- Permissions (spatie, guard `api`): `manage plans` (admin), `get plans`, `subscribe to plans`, `upgrade plans`, `cancel subscription`, `view my subscription` (user)

## User Journey (end-to-end)

### Flow 1 — Admin configures plans
1. `POST /api/v1/admin/set-plans` (admin, `manage plans`) — bulk upsert by `name`
2. Plans seeded by `PlanSeeder` (Free 0 / Pro 199.00 / Business 499.00 EGP) — `db:seed --class=PlanSeeder`

### Flow 2 — User browses plans
3. `GET /api/v1/plans` (`get plans`) — only `is_active=true`, ordered by `price_cents`

### Flow 3 — User subscribes
4. `POST /api/v1/me/subscribe` with `plan_id` (`subscribe to plans`)
   - 422 if an active subscription already exists (must upgrade or cancel first)
   - 422 if plan inactive (validation `exists:plans,id,is_active,1`)
   - Creates `subscriptions` row: status `active`, `price_cents` = plan snapshot, `renews_at` = +1 month / +1 year by `billing_cycle`
   - Resets AI quota: `ai_generations_count = 0`, `ai_reset_at = +1 month`
   - `provider` / `provider_ref` stay `null` until the Paymob task lands

### Flow 4 — User upgrades (prorated)
5. `POST /api/v1/me/upgrade` with `plan_id` (`upgrade plans`)
   - 422 without active subscription or same plan
   - Response: `unused_credit_cents` (remaining value of current cycle) + `prorated_charge_cents` (max 0 of diff)
   - Charge execution deferred — `note` field marks it
   - Subscription snapshot moves to new plan; `renews_at` resets; AI quota re-seeded

### Flow 5 — User cancels
6. `POST /api/v1/me/subscription/cancel` (`cancel subscription`) — status `cancelled`, `renews_at = null`
   - 422 without active subscription

### Flow 6 — User views subscription
7. `GET /api/v1/me/subscription` (`view my subscription`) — latest row + loaded `plan`
   - `data: null` when never subscribed

## Postman request bodies (all routes use `{{base_url}}` + bearer `{{token}}`)

### 1. Admin set plans
```json
POST {{base_url}}/v1/admin/set-plans
{
  "plans": [
    { "name": "Free",      "price_cents": 0,     "billing_cycle": "monthly", "ai_quota_monthly": 5,   "features": ["3 trips", "5 AI generations / month"] },
    { "name": "Pro",       "price_cents": 19900, "billing_cycle": "monthly", "ai_quota_monthly": 50,  "features": ["Unlimited trips", "50 AI generations / month", "Priority support"] },
    { "name": "Business",  "price_cents": 49900, "billing_cycle": "monthly", "ai_quota_monthly": 200, "features": ["Unlimited trips", "200 AI generations / month", "API access"] }
  ]
}
```
> Requires admin token (role `admin` + permission `manage plans`).

### 2. List plans
```json
GET {{base_url}}/v1/plans
```
> Requires user token (`get plans`). Response `data[]`: `id, name, price_cents, currency, billing_cycle, ai_quota_monthly, features, is_active`.

### 3. Subscribe
```json
POST {{base_url}}/v1/me/subscribe
{
  "plan_id": 2
}
```
> 201 + `data`: subscription + `plan`. 422: already active / inactive plan / invalid id.

### 4. Upgrade
```json
POST {{base_url}}/v1/me/upgrade
{
  "plan_id": 3
}
```
> 200 + `data.subscription`, `data.unused_credit_cents`, `data.prorated_charge_cents`, `data.note`.

### 5. Cancel subscription
```json
POST {{base_url}}/v1/me/subscription/cancel
{}
```
> 200 + cancelled subscription. 422: no active subscription.

### 6. View subscription
```json
GET {{base_url}}/v1/me/subscription
```
> 200 + `data` (subscription with `plan`) or `data: null`.

## Verification checklist

- [ ] `php artisan migrate` — plans, subscriptions, users quota columns
- [ ] `php artisan db:seed --class=RoleAndPermissionSeeder` then `--class=PlanSeeder`
- [ ] `php artisan test --filter=PlansTest` — 14 tests green
- [ ] Full suite: `php artisan test` — 172 passed
- [ ] Postman: run folder `Plans` in order 1→6 with admin token for #1 and user token for #2–6

## Deferred (next tasks)

- [ ] Paymob charge on subscribe/upgrade (`provider`, `provider_ref` + webhook confirm)
- [ ] Redis cache for `GET /plans` (1 h TTL, invalidate on `setPlans`)
- [ ] AI quota consumption hook on generation endpoint (F2)
