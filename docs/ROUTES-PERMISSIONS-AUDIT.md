# Route Permissions Audit

Generated 2026-08-09 · 165 routes (API 121 + infra 44) · Guard `api` everywhere ·
Middleware chain = `api` + optional `auth:api` + optional `permission:X` (spatie) / `role:R`.
Verdicts: ✅ as-is · ⚠️ gap found · 🟡 production note.

---

## 1. Protection model — what decides a route's gate

| Route kind | Gate | Why |
|---|---|---|
| Read-only catalog (destinations, hotels, flights, restaurants, attractions, categories, site-settings) | Public | Storefront data, no PII, no writes; browsable pre-login, SEO/preview |
| Location data by public id (destination maps, weather) | Public | Only public entity ids are inputs |
| Payment callback / webhook | Public + HMAC | Gateway cannot authenticate; payload signature must be self-verifying |
| Anonymous contact submit | Public + throttle | Lead capture for anonymous visitors |
| Own user's rows (dashboard, favourites, reviews, trips, surveys, notifications, profile) | `auth` + **owner scope in controller** | Middleware proves login, not ownership — identity checks live in code |
| Paid product logic (plans, subscriptions, AI review) | `auth` + `permission:X` | Distinguish tiers/roles; premium = permission-gated |
| Admin CRUD of shared entities | `auth` + `permission:manage X` | Admin-only capability, role-summed, exact-string matched |
| Admin-wide reports / notifications | `auth` + `role:admin|super_admin` | Applies to all users; ownership irrelevant |
| Infra (web root, docs, mail preview, storage, telescope, health) | web/storage/none | No user data |

---

## 2. Verification status per category

### 2.1 Public routes (18) — stay public

| Method | URI | What it does | Verdict | Why |
|---|---|---|---|---|
| GET | `/api/v1/categories`, `/{category}` | Category tree | ✅ | catalog |
| GET | `/api/v1/destinations`, `/{id}` | Destination catalog | ✅ |
| GET | `/api/v1/hotels`, `/{id}` | Hotel catalog | ✅ |
| GET | `/api/v1/flights`, `/{id}` | Flight catalog | ✅ |
| GET | `/api/v1/restaurants`, `/{id}` | Restaurant catalog | ✅ |
| GET | `/api/v1/attractions`, `/{id}` | Attraction catalog | ✅ |
| GET | `/api/v1/site-settings` | Public brand/settings | 🟡 verify controller returns only non-secret keys |
| POST | `/api/v1/contacts` | Visitor -> admin inbox message | 🟡 add `throttle` (currently none) |
| GET | `/api/weather` | Weather for poi/city | ✅ | aggregated, no state |
| GET | `/api/v1/maps/destination/{destination}` | Public city map | ✅ | public entity |
| POST | `/api/v1/paymob/webhook` | Paymob payment event sink | ✅ | HMAC verified per payload + stored; must be callable by gateway |
| GET | `/api/v1/paymob/callback` | Payment redirect landing | ✅ | HMAC re-checked; stateless |

### 2.2 Auth-only, owner-scoped (26 app routes)

| Route | Action | Owner check | Verdict |
|---|---|---|---|
| `GET api/user` · `logout` · `refresh` | Session/me | own | ✅ |
| email verify (`verify/{id}/{hash}` signed) · `verify-notice` · `resend` | mailbox verify | own/signed | ✅ |
| `PATCH /api/v1/profile` | Edit profile | own | ✅ |
| `GET /api/v1/dashboard` (+ trips, favourites) | Personal stats | `user_id` filters in DashboardController | ✅ |
| `POST /api/v1/favourites/{type}/{id}` | Toggle user favourite | user_id scope (InteractionController) | ✅ |
| `POST /api/v1/reviews/{type}/{id}` · `DELETE /api/v1/reviews/{id}` | Review create/delete; deleteOwner `review->user_id` | 403 otherwise | ✅ |
| `GET /api/v1/maps/trip/{trip}` | Trip map | ⚠️ **NO owner check (route-bound unwarranted)** | GAP #2 |
| `POST /api/v1/trips` · `GET /v1/trips/create` · `GET /v1/trips/{trip}` | create/show trip | `show()` aborts on foreign `user_id` ✓ | ✅ |
| `POST /trips/{trip}/attach/{type}` · `DELETE /trips/{trip}/detach/{id}` | attach/detach items | ⚠️ **attach/detach methods don't exist → 500** | GAP #3 |
| `POST /api/trips/{trip}/fork` | trip fork | `abort(400)` — disabled by design | ✅ |
| `GET /api/v1/notifications`, `PATCH /read-all`, `PATCH /{n}/read` | user notifications | notifiable checks + `user_id` (NotificationController) | ✅ |
| `GET /api/me/reports` | personal reports | `where('user_id')` | ✅ |
| `GET api/review/{id}` | AI review of trip | ⚠️ **trips by id accessible cross-user** | GAP #1 |
| `POST api/review` | generate AI review | trips by ids — scope like POST | GAP #1 (POST too) |
| `POST checkout/initiate` | payment session | own user | ✅ |
| `api/surveys` ×5 | survey CRUD | **fixed 08-2026 owner-scope** | ✅ |
| `POST /me/subscribe` · `upgrade` · `cancel` · `GET /me/subscription` | plan flows | own + tier perms (below) | ✅ |

### 2.3 Permission-gated admin (permission:…)
CRUD **admin** endpoints (4 each where marked):
`manage users` (6 routes: index+show+store+update+active+block) — account/lifecycle
`manage trips` (admin trips CRUD) `manage destinations` `categories` `hotels` `flights` `restaurants` `attractions` `countries` `reviews`(+approve/reject) `contacts`(inbox/regex) `settings`(GET/PUT/{key}) `analytics`(index+revenue) `manage plans`(set-plans POST) — **admin & role only**
+ user-facing: `get plans` (`GET /api/v1/plans`), `generate ai itineraries` (AI gating), `subscribe to plans`, `upgrade plans`, `cancel subscription`, `view my subscription` — tier/user perms.

| Permission (exact) | Routes | Reason |
|---|---|---|
| `manage users` | GET/POST admin/users, PUT users/{id}, PATCH active/block | can deactivate accounts — admin only |
| `manage trips` | admin trips* | review others' trips |
| `manage *` (8 resource perms) | admin CRUD ×4 each | admin publishing |
| `manage reviews` | admin reviews + approve/reject/delete | content moderation |
| `manage contacts` | admin contacts index/read/resolve | internal inbox |
| `manage settings` | settings GET/PUT/{key} | secrets-laced config |
| `view analytics` | analytics + revenue | business metrics, admin |
| `manage plans` (set-plans) | admin/set-plans | define tier/price |
| `get plans` | GET /api/v1/plans | user-facing free read: everyone |
| `subscribe to plans` · `upgrade plans` · `cancel subscription` · `view my subscription` | me/* | paid user flows, tiered for user role |
| `generate ai itineraries` | POST api/review | premium AI feature gate |

### 2.4 Role-gated (no permission — admin-wide multi-user)

| Route | Gate | Why |
|---|---|---|
| `GET /api/v1/admin/notifications` | `role:admin|super_admin` | platform notifications |
| `GET /api/v1/admin/reports` · `POST /reports/generate` · `GET /reports/{id}/download` | `role:admin|super_admin` | cross-user reports; ownership varies |

### 2.5 Infra (no auth — by design)

| Route | Gate | Note |
|---|---|---|
| `GET /` | web | root page |
| `docs/api`, `docs/api.json` | web + RestrictedDocsAccess | docs UI — gated alias |
| `mail-preview/{type}` | web | dev mail fluid |
| `storage/{path}` (GET/PUT) | storage | local-drive file serve (Laravel builtin) |
| `GET /up` | none | health probe |
| `telescope/*` (44) | telescope | route gate = `Telescope` provider gate — verify production lock ✓**

---

## 3. Gaps found (ordered)

| # | Sev | Route | Problem | Fix |
|---|---|---|---|---|
| 1 | 🔴 | `GET /api/review/{id}` | Any authed user can read any trip's itinerary (no owner filter)` | Add `where('user_id', auth()->id())` like `TripController::show`; or drop endpoint (AI review only via POST) |
| 2 | 🔴 | `GET /api/v1/maps/trip/{trip}` | accepts anyone's trip id | ownership check in MapController::trip (same as trip show) |
| 3 | 🟠 | `POST api/v1/trips/{trip}/attach` · `DELETE ..detach` | Controller methods absent → 500 | remove route or implement w/ owner check |
| 4 | 🟡 | `POST /api/v1/contacts` | public unthrottled | `->middleware('throttle:5,1')` |
| 5 | 🟡 | `GET /api/v1/site-settings` | ensure returns whitelisted keys only | whitelist return |
| 6 | 🟡 | `mail-preview` + telescope | prod exposure | gate behind env/Telescope::auth |

## 4. Seeder vs routes — permission drift

- All 20 permission strings in routes exist in `RoleAndPermissionSeeder` (`guard_name = 'api'`) — 100% match ✅
- **6 seeded permissions unused by any route** (dead weight; fine to drop or keep for future): `assign admins`, `create trips`, `manage own profile`, `manage own trips`, `manage own favourites`, `write reviews`
- `role:admin|super_admin` role names exist and have guard `api` ✅

## 5. Principle re: comparisons
- **Public does NOT mean unprotected** — payment/contact routes rely on payload-level validation (HMAC) + rate limits. Apply throttle to contacts (#4).
- **auth does NOT mean authorized** — owner-scoping lives in controllers; middleware can't tell "whose row". Fix #1–#3 close the three places rows leak across users.
- **permission strings must be identical** between routes/api.php and seeder — verified programmatically (20/20).