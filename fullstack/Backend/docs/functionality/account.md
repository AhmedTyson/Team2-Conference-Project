# Functionality — Account Domain

Source-verified from: controllers, services, repositories, requests, models, `route:list --json`, `AppServiceProvider` rate limiters, `users` migration, `RoleAndPermissionSeeder`, `UserFactory`. Audit date: 2026-08-13.

## Scope

Account = authentication (JWT), registration, email verification, password reset, profile, admin user management, roles/permissions seed, User/UserPoint models. Frontend excluded by plan decision.

## Models

### User (`app/Models/Account/User.php`)
- `Authenticatable` (Laravel `Illuminate\Foundation\Auth\User` base, which natively provides `sendEmailVerificationNotification()` — verified via reflection: declaring class `Illuminate\Foundation\Auth\User`), implements `JWTSubject`, uses `HasFactory, HasRoles (Spatie), Notifiable`.
- `$guard_name = 'api'`.
- Fillable: name, email, phone, password, profile_image, is_active, ai_generations_count, ai_reset_at.
- Casts: email_verified_at→datetime, password→hashed, is_active→boolean, ai_generations_count→integer, ai_reset_at→datetime.
- Hidden: password, remember_token.
- Relations: survey (1:1), notifications (1:M), trips (1:M), favourites (1:M), reviews (1:M), subscriptions (1:M).
- `getJWTCustomClaims()` returns `[]` — role claims are added at login time by controller.

### Role (`app/Models/Account/Role.php`)
- Extends `Spatie\Permission\Models\Role`; `$guard_name = 'api'`; fillable restricted to `name`, `guard_name` (mass-assignment hardening; base Spatie Role is fully guarded-open).

### UserPoint (`app/Models/Account/UserPoint.php`)
- Points ledger per user per action; fillable user_id/action/points/metadata (metadata cast to array); `belongsTo(User)`.

## Roles & Permissions (seeded by `database/seeders/RoleAndPermissionSeeder.php`)

| Role | Permissions |
| --- | --- |
| super_admin | assign admins + ALL admin permissions |
| admin | manage users, trips, destinations, categories, hotels, restaurants, attractions, reviews, contacts, settings, countries, plans, flights, view analytics |
| user | manage own profile, create trips, manage own trips, generate ai itineraries, write reviews, manage own favourites, get plans, subscribe to plans, upgrade plans, cancel subscription, view my subscription |
| agency | catalog.hotels.view, catalog.restaurants.view, catalog.attractions.view, catalog.flights.view, catalog.destinations.view |

All permissions created with `guard_name = 'api'` (firstOrCreate); roles synced with `syncPermissions`/`givePermissionTo`.

## Functionality Table

| Functionality / Feature | File(s) | Route(s) | What It Does | Key Inputs | Outputs / Return Shape | Errors / Edge Cases |
| --- | --- | --- | --- | --- | --- | --- |
| Register user | `AuthController@register` + `RegisterRequest` | `POST api/register` (throttle:register = 5/min per IP) | Creates user with role `user` (Role::firstOrCreate), hashes password, sends email-verification notification + `WelcomeNotification`, logs in, returns JWT carrying roles claim | name, email (unique), phone, password (min 8, confirmed) | 201 `{token, user:{id,name,email,roles,phone}}` | 422 validation (email unique message customized); inactive flag not applied at registration |
| Login | `AuthController@login` + `LoginRequest` | `POST api/login` (throttle:login = 5/min per IP+email) | Attempts JWT auth with roles claim; rejects inactive users with same generic message as bad credentials | email, password | 200 `{token, user:{id,name,email,roles}}` | 401 `{message:'Invalid email or password', error:'invalid_credentials'}` for bad creds OR `is_active=false` (account-unlock safe, no user enumeration) |
| Logout | `AuthController@logout` | `POST api/logout` (auth:api) | Invalidates current JWT | — | 200 `{message:'User Logged out Successfully'}` | — |
| Refresh token | `AuthController@refresh` | `POST api/refresh` (auth:api, throttle:15,1) | Issues fresh JWT | — | 200 `{token}` | 401 when token expired/invalid |
| Get current user | `AuthController@me` | `GET api/user` (auth:api) | Returns authenticated profile | — | 200 `{user:{id,name,email,roles,phone}}` | 401 unauthenticated |
| Update own profile | `AuthController@updateProfile` + `UpdateProfileRequest` | `PATCH api/profile` (auth:api) | Partial update of own profile; deletes old profile_image from `public` disk on replace; stores new image under `profile-images/`; hashes password if present | name?, email? (unique except self), phone? (unique except self), profile_image? (image, ≤2MB), password? (min 8, confirmed) | 200 `{user:{id,name,email,profile_image(url or null),roles}}` | 422 validation; missing auth → 401 (authorize() requires user); validation enforces phone uniqueness though DB column has no unique index (migration line: `phone` string(20) nullable, no unique) |
| Verification notice | `AuthController@verificationNotice` | `GET api/email/verify-notice` (auth:api) | Always returns "please verify email" payload | — | 403 `{message:'Please verify your email address.', error:'email_not_verified'}` | — |
| Verify email | `AuthController@verifyEmail` | `GET api/email/verify/{id}/{hash}` (signed middleware) | Compares `hash` to `sha1(email)` (hash_equals); marks verified; fires `Illuminate\Auth\Events\Verified` | id, hash (from verification link; URL signed by MustVerifyEmail flow) | 200 success: 'Email verified successfully' or 'Email already verified' | 403 `invalid_verification_link` on hash mismatch / invalid signature (403 from signed middleware) |
| Resend verification email | `AuthController@resendVerificationEmail` | `POST api/email/resend` (auth:api, throttle:6,1) | Re-sends verification notification unless already verified | — | 200 'Verification link sent successfully.' / 'Email already verified.' | — |
| Forgot password | `AuthController@forgetPassword` + `ForgotPasswordRequest` | `POST api/forgot-password` (throttle:3,10) | Sends reset link via default password broker (uses `password_reset_tokens` table) | email (must exist in users) | 200 on `RESET_LINK_SENT`; else 422 `{error:'reset_link_failed'}` | Unknown email blocked by `exists:users,email` validation (422, not 200 — enumeration-safety tradeoff of the current rule) |
| Reset password | `AuthController@resetPassword` + `ResetPasswordRequest` | `POST api/reset-password` (throttle:5,1) | Validates token via broker, updates password (hashed) | email, token, password (min 8, confirmed) | 200 'Passwrod reset successfully' (sic — typo in source, reproduced verbatim) | 422 `{error:'reset_failed', message:<broker status string>}` on invalid/expired token |
| Admin: list users | `AdminUserController@index` + `UserService@getAdminList` + `UserRepository@getAllForAdmin` | `GET api/v1/admin/users` (auth:api, permission:manage users) | Eager-loads roles, ordered latest first | — | 200 `UserResource` collection (id, name, email, profile_image, verified_at, is_active, roles, created_at; trips only when loaded) | 403 without permission |
| Admin: show user | `AdminUserController@show` + `UserService@showAdmin` | `GET api/v1/admin/users/{user}` (auth:api, permission:manage users) | Loads user with trips, reviews, subscriptions | user id | 200 UserResource (trips mapped to id/title/budget/status/no_of_days/start_date/end_date) | 404 unknown id (`findOrFail`) |
| Admin: create user | `AdminUserController@store` + `StoreUserRequest` + `UserService@store` | `POST api/v1/admin/users` (auth:api, permission:manage users) | Creates user (name, email, password hashed, is_active default 1); does NOT assign roles | name, email (unique), password (min 8), is_active? | 200/201 UserResource | 422 validation; 403 without permission |
| Admin: update user | `AdminUserController@update` + `UpdateUserRequest` + `UserService@update` | `PUT api/v1/admin/users/{user}` (auth:api, permission:manage users) | Updates name/email/is_active only | name?, email? (unique except self), is_active? | 200 UserResource | 422; 404 |
| Admin: activate user | `AdminUserController@active` + `UserService@setActive` | `PATCH api/v1/admin/users/{user}/active` (auth:api, permission:manage users) | Sets is_active=1 | user id | 200 UserResource | 404 |
| Admin: block user | `AdminUserController@block` + `UserService@setBlock` | `PATCH api/v1/admin/users/{user}/block` (auth:api, permission:manage users) | Sets is_active=0 (login blocked via generic 401) | user id | 200 UserResource | 404 |

## Rate Limiters (named, `app/Providers/AppServiceProvider.php` boot())

| Name | Limit | Key |
| --- | --- | --- |
| login | 5/min | IP + email (lowercased) |
| register | 5/min | IP |
| ai | perDay(config('ai.rate_limit_per_day')) | user id or IP |
| maps | 10/min | IP |
| checkout | 5/min | user id or IP |
| password_reset | 3 per 10 min | IP |
| password_reset_strong | 5/min | IP |
| refresh_token | 15/min | IP |
| resend_email | 6/min | IP (limiter defined; the route itself uses inline `throttle:6,1` — verified from `route:list`) |
| api_authenticated | 60/min | user id or IP |

## Tests Covering Account (existing evidence)

`tests/Feature/Account/`: `UserTest`, `AuthThrottleTest`, `BlockedUserTest`, `RoleMassAssignmentTest`, `VerificationTest`; plus `tests/Feature/EmailIntegrationTest.php` (5 email flows). All pass in Phase-0 baseline (257/900).

## Notes / Findings (verified, not fixed)

1. `phone` — `RegisterRequest` declares a custom message for `phone.unique` but the rule has no `unique`; users migration has no unique index on `phone`. Uniqueness enforced only in `UpdateProfileRequest` (soft, per-row check). Inconsistency documented; not changed (audit-only).
2. Success message typo "Passwrod reset successfully" reproduced from source.
3. `resend_email` named limiter is defined but the route uses inline `throttle:6,1` — equivalent values, but two definitions exist.
4. `User::getJWTCustomClaims()` empty; roles travel via login-time claims, so role changes are visible only after re-login.
5. Admin create user does not assign roles — new admin users start role-less until assigned elsewhere (no route for role assignment found in Account; `assign admins` permission exists but no controller action uses it in this domain).
