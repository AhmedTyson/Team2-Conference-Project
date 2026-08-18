# SPEC — Newsletter Subscription (Backend endpoint + Footer wire-up)

Status: APPROVED (user) — 2026-08-18. Revisions: duplicates → 409 (primary), throttle keyed by user id + IP, no users-table dedupe.
Stack: Laravel 12 (`fullstack/Backend`) + vanilla JS frontend (`fullstack/Frontend`)

---

## 1. Goal

- Backend: public `POST /api/newsletter/subscribe` — validate email, persist subscriber, idempotent on duplicates, JSON response.
- Frontend: footer newsletter form (already mounted by `footer-component.js`) stops faking success — shows error toast when the call fails.

## 2. Non-goals

- Newsletter admin inbox/management (new slice later, mirrors `ContactMessageController@index`).
- Unsubscribe endpoint.
- Welcome/confirmation emails.
- Double opt-in.

## 3. Evidence anchors (verified)

| Decision | Evidence |
|---|---|
| Response envelope = `ApiResponse` success/fail | `app/Support/ApiResponse.php:10-45` — `success` → `{success,message,data}`; `fail` → `{error:{type,status,message,timestamp}}` |
| Contact-form pattern to mirror | `app/Http/Controllers/System/ContactController.php:20-25` — FormRequest + Service + `ApiResponse::success(null, msg, 201)` |
| Validation error shape (422) | `app/Exceptions/ApiExceptionHandler.php:112-135` — `ApiResponse::fail(..., 422, 'The provided data is invalid.', ['validation_errors' => [...]])` |
| Duplicate DB constraint → 409 fallback | `ApiExceptionHandler.php:204-207` — MySQL 1062 → 409 `'A record with this information already exists.'` |
| Public write route + throttle pattern | `routes/api.php:410` — `Route::post('/contacts', ...)->middleware('throttle:contacts')`; limiter `app/Providers/AppServiceProvider.php:138-140` — 5/min per IP |
| Global API throttle + JSON-always errors | `bootstrap/app.php:34-52` (`throttle:api_authenticated` group; `shouldRenderJsonWhen` always true) |
| Migration style ref | `database/migrations/2026_08_01_025941_create_contact_message_table.php` (id, `$table->timestamps()`, down = dropIfExists) |
| Model style ref | `app/Models/System/ContactMessage.php` — `$fillable`, `HasFactory`, namespace `App\Models\System` |
| Test style refs | `tests/Feature/System/ContactAndSettingsTest.php:31-52` (postJson → assertStatus(201) → assertJson success → assertDatabaseHas); `tests/Feature/Account/SocialRegistrationTest.php` (RefreshDatabase, `Tests\TestCase`) |
| Frontend API transport | `assets/js/core/api.js:114-235` — `apiPost` returns `{ok,status,body}`; NEVER rejects on HTTP errors (only network failure); 401 auto-refresh logic irrelevant here |
| Frontend current footer handler | `assets/js/core/footer-component.js:62-88` — form `#footerNewsletterForm`, input `input[type="email"]`, `itineraria.apiPost("/newsletter/subscribe", {email})`, `.then(done()).catch(done())` → success toast both paths (bug: 422/500 also shows success) |
| Footer HTML | `components/footer.html:24-33` — form id `footerNewsletterForm`, email input `type="email" required`, no id (selector `input[type="email"]` used in JS — no HTML change needed) |
| CORS | `config/cors.php:18-34` — paths `api/*`, origins `*` default or `CORS_ALLOWED_ORIGINS` env; `HandleCors` prepended globally `bootstrap/app.php:25`. Prod: frontend copied into Laravel `public/` (same origin, `config.js:43-46`). No CORS change needed |
| API base resolution | `assets/js/config.js:23-50` — `__API_BASE__` sentinel / same-origin `/api` prod / `127.0.0.1:8000/api` dev. `api.js:17-54 normalizePath` strips `/api` + legacy `/v1` prefixes |

## 4. Design decisions

1. **Path**: `POST /newsletter/subscribe`, registered in `routes/api.php` SYSTEM section (after `contacts`, line 410) with named throttle `newsletter`. Frontend call `/newsletter/subscribe` lands at `/api/newsletter/subscribe` via `normalizePath` (api.js:21) + base `/api`.
2. **Duplicate handling → 409 Conflict (user decision), not idempotent 200.**
   - Mechanic: `firstOrCreate` → `wasRecentlyCreated` false → controller returns `ApiResponse::fail('This email is already subscribed.', 'ConflictError', StatusCode::HTTP_409)`.
   - Unique index still race backstop (MySQL 1062 → `ApiExceptionHandler` 409, same status — consistent).
   - Frontend: 409 branch → info toast "You're already subscribed to our newsletter!" (user not penalized), input retained.
3. **Email normalization**: `strtolower(trim())` in service before persist → unique index effective case-insensitively.
4. **Table** `newsletter_subscribers`: `id`, `email` (string, `unique()`), `$table->timestamps()`. No status column (no workflow; unlike contact_messages which needs `status` for admin inbox — deferred with admin slice).
5. **Auth**: public, no middleware on route. Throttle `newsletter` limiter 5/min keyed by authenticated user id, else IP (mirrors `checkout`, AppServiceProvider:130-133 — SEC-08 pattern). Note: global `throttle:api_authenticated` group applies too (60/min) — fine.
6. **Validation**: FormRequest — `email: ['required', 'email', 'max:255']`. NO `unique` rule (409 returned explicitly by service branch). Invalid → default 422 envelope (`ApiExceptionHandler`).
7. **Layering**: Controller → FormRequest + Service (mirrors ContactController). No repository interface — single-table aggregate, read path belongs to future admin slice. Model `App\Models\System\NewsletterSubscriber`.
8. **Response copy**: success `'Successfully subscribed to the newsletter.'` (201/200); data `null` — matches contact response shape `ApiResponse::success(null, msg, status)`.
9. **CORS**: no change (see evidence).
10. **Localization of frontend errors**: `footer-component.js` must inspect `res.ok` (apiPost never rejects for HTTP errors). Error toast copy: enable button spinner optional — keep slice minimal, no spinner.

## 5. Slices (independent, ≤5 min review each; implement in order)

### Slice 1 — Migration + Model
- `fullstack/Backend/database/migrations/YYYY_MM_DD_HHMMSS_create_newsletter_subscribers_table.php` (generate at impl time via `php artisan make:migration create_newsletter_subscribers_table`):
  - `$table->id();` `$table->string('email')->unique();` `$table->timestamps();` `down(): Schema::dropIfExists('newsletter_subscribers');`
- `fullstack/Backend/app/Models/System/NewsletterSubscriber.php`:
  - `namespace App\Models\System;` — `use HasFactory;` — `protected $fillable = ['email'];`
- Verify: `php artisan migrate` clean; new file matches contact migration style.

### Slice 2 — FormRequest + Service
- `app/Http/Requests/System/StoreNewsletterSubscriptionRequest.php`:
  - `authorize(): true`
  - `rules(): ['email' => ['required', 'email', 'max:255']]`
- `app/Services/System/NewsletterService.php`:
  - `subscribe(string $email): bool` — `$normalized = strtolower(trim($email));` `$subscriber = NewsletterSubscriber::firstOrCreate(['email' => $normalized]);` `return $subscriber->wasRecentlyCreated;`
- Verify: artisan `make:request` / `make:service` style not required — plain files, PSR-4. No tests yet (covered in Slice 4).

### Slice 3 — Controller + Route + Rate limiter
- `app/Http/Controllers/System/NewsletterController.php`:
  - ctor-inject `NewsletterService`
  - `store(StoreNewsletterSubscriptionRequest $request): JsonResponse` — `$created = $this->newsletterService->subscribe($request->validated()['email']);` → created ? `ApiResponse::success(null, 'Successfully subscribed to the newsletter.', StatusCode::HTTP_201)` : `ApiResponse::fail('This email is already subscribed.', 'ConflictError', StatusCode::HTTP_409)`
  - `use App\Support\ApiResponse; use App\Support\Constants\StatusCode;` (StatusCode has HTTP_201/HTTP_200, ApiResponse.php:16-22)
- `routes/api.php`:
  - add `use App\Http\Controllers\System\NewsletterController;` to System use block (lines 33-43)
  - after line 410 contacts route, inside `// ---- Public contacts & weather` block: `Route::post('/newsletter/subscribe', [NewsletterController::class, 'store'])->middleware('throttle:newsletter');`
- `app/Providers/AppServiceProvider.php` boot, after `'contacts'` limiter (line 140):
  - `RateLimiter::for('newsletter', fn (Request $request) => Limit::perMinute(5)->by($request->user('api')?->id ?? $request->ip()));`
- Verify: `php artisan route:list --path=newsletter` shows route + middleware.

### Slice 4 — Feature tests
- `tests/Feature/System/NewsletterTest.php` (`RefreshDatabase`, `Tests\TestCase`, mirror ContactAndSettingsTest.php:31-52 + SocialRegistrationTest style):
1. `test_valid_email_subscribes_with_201` — `postJson('/api/newsletter/subscribe', ['email' => 'john@example.com'])` → `assertStatus(201)` → `assertJson(['success' => true, 'message' => 'Successfully subscribed to the newsletter.'])` → `assertDatabaseHas('newsletter_subscribers', ['email' => 'john@example.com'])`.
   2. `test_duplicate_email_returns_409_single_row` — post same email twice → first 201, second `assertStatus(409)` + `assertJsonPath('error.type', 'ConflictError')`; `assertDatabaseCount('newsletter_subscribers', 1)`.
  3. `test_email_is_normalized_to_lowercase` — post `'USER@Example.COM'` → `assertDatabaseHas('newsletter_subscribers', ['email' => 'user@example.com'])`.
  4. `test_invalid_email_returns_422` — post `'not-an-email'` → `assertStatus(422)` → `assertJsonPath('success', false)` → `assertJsonStructure(['error' => ['type','status','message','timestamp','validation_errors']])`.
  5. `test_missing_email_returns_422` — post `[]` → `assertStatus(422)`.
- Verify: `php artisan test --filter=NewsletterTest` green; full suite still 304+5 green.

### Slice 5 — Frontend error handling
- `fullstack/Frontend/assets/js/core/footer-component.js` — replace submit handler block (lines 64-87):
  - keep `#footerNewsletterForm` + `input[type="email"]` lookup (no footer.html change)
  - guard: empty email → return (unchanged)
  - extract `showSuccess()` = existing toast copy `'Welcome to the Executive Travel Club!'` (keep exact copy; `Itinera.toast` → `ItineraToast.success` → `alert` fallback chain, lines 70-78)
  - add `showError()` = `'Couldn\'t subscribe right now. Please try again later.'` via same toast chain, type `'error'` (or `ItineraToast.error` if present — check `ItineraToast` API at impl time; fall back to `'error'`-typed `Itinera.toast`)
  - apiPost branch (lines 79-82): `.then(function (res) { if (res && res.ok) { showSuccess(); if (input) input.value = ''; } else { if (res && res.status === 409) { showInfo('You\'re already subscribed to our newsletter!'); } else { showError(); } } })` `.catch(function () { showError(); })`
   - `showInfo` = existing toast chain with `'info'` type fallback to success chain (409 is not a failure for the user)
  - IMPORTANT: only clear input on success (currently cleared unconditionally at line 86 — keep the email on failure so user can retry)
  - no-API fallback (`else done()` at line 84) → keep calling `showSuccess()` (offline demo mode)
- Verify: manual — dev server on :8080, submit valid email → success toast + input cleared; submit invalid email → error toast + input retained; backend down → error toast.

## 6. API contract (final)

### `POST /api/newsletter/subscribe`
Request (JSON):
```json
{ "email": "user@example.com" }
```
Responses:

| Case | Status | Body |
|---|---|---|
| New subscriber | 201 | `{"success": true, "message": "Successfully subscribed to the newsletter.", "data": null}` |
| Already subscribed | 409 | `{"error": {"type": "ConflictError", "status": 409, "message": "This email is already subscribed.", "timestamp": "..."}}` |
| Invalid/missing email | 422 | `{"error": {"type": "ValidationException", "status": 422, "message": "The provided data is invalid.", "timestamp": "...", "validation_errors": [{"field": "email", "message": "..."}]}}` (error envelope has NO `success` key — `ApiResponse::fail` shape) |
| Rate limited (5/min) | 429 | Laravel throttle envelope via ApiExceptionHandler |
| Race-condition duplicate (MySQL 1062) | 409 | `ApiExceptionHandler` query-conflict body (same status, edge only) |

Auth: none. CORS: handled globally (no change).

## 7. Verify-ability checklist

- [ ] `php artisan test` — full suite green (304 existing + 5 new)
- [ ] `php artisan route:list --path=newsletter` — route registered with `throttle:newsletter`
- [ ] curl happy path → 201 + success body; repeat → 200; garbage email → 422
- [ ] browser: footer form success + error paths per Slice 5 verify list

## 8. Open questions / deviations

1. **Idempotent 200 chosen over 409** — required "idempotent-friendly"; frontend has no 409 branch. Confirm.
2. **No repository layer** (ContactMessage uses one) — newsletter has no reads yet; admin slice can add repository lazily. Confirm or request mirror.
3. **Success toast copy unchanged** ("Welcome to the Executive Travel Club!") — error toast copy is new. Confirm copy.
4. **Throttle 5/min/IP** mirrors `contacts` — if marketing campaigns expect bursts, raise to 10. Confirm.
15. **Email dedupe against `users` table not in scope** — newsletter list standalone (user may also subscribe). Confirmed by user (implement what is right = separate opt-in list).