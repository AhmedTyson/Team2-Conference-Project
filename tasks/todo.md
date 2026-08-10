# Task List: Site Settings Public Cache (WebsiteSettingsCache-SPEC)

Spec: `Team2-Docs/06-Specs/WebsiteSettingsCache-SPEC.md`
Branch: `CoLeader` | Guard: `auth:api` | Cache: `rememberForever` + `forget`-on-write

---

## Task 0: Baseline check [DONE on branch]
- [x] `git status --short` clean on `CoLeader`
- [x] `php artisan test` full suite green before starting
- [x] `php artisan route:list --name=admin` shows settings GET/PUT

---

## Task 1: Add constants + helpers to `Setting` model
**Size:** S | **Dependencies:** None

- [ ] Add `PUBLIC_CACHE_KEY = 'site-settings.public'` const
- [ ] Add `SITE_KEYS` array const: `['site_name','logo_url','tagline','homepage_banner']`
- [ ] Add `SITE_KEYS_PREFIX` array const: `['contact_','social_']`
- [ ] Implement `isPublicKey(string $key): bool` — exact OR prefix match
- [ ] Implement `publicData(): array` — `pluck('value','key')` filtered by `isPublicKey`, sorted by key
- [ ] Implement `forgetPublicCache(): void` — `Cache::forget(self::PUBLIC_CACHE_KEY)`

**Files:** `app/Models/Setting.php`
**Verify:** `php -l app/Models/Setting.php`

---

## Task 2: Write failing tests (RED)
**Size:** M | **Dependencies:** Task 1

- [ ] Create `tests/Feature/SiteSettingsPublicTest.php`
- [ ] A1a: whitelisted rows → 200, data has only whitelisted keys
- [ ] A1b: non-whitelisted key absent from data
- [ ] A1c: empty table → 200 `{"success":true,"data":{}}`
- [ ] A2: two GETs → same JSON, 1 DB query (`DB::enableQueryLog`)
- [ ] A3a: admin PUT → `Cache::has` false
- [ ] A3b: GET after admin PUT → returns new value
- [ ] A4a: unauthenticated PUT → 401
- [ ] A4b: non-admin PUT → 403
- [ ] A4c: GET without token → 200

**Files:** `tests/Feature/SiteSettingsPublicTest.php`
**Verify:** `php artisan test --filter=SiteSettingsPublicTest` → all RED

---

## Task 3: Create `SiteSettingsController` + wire route
**Size:** S | **Dependencies:** Task 1

- [ ] Create `app/Http/Controllers/SiteSettingsController.php`
  - `index()`: `Cache::rememberForever(Setting::PUBLIC_CACHE_KEY, fn() => Setting::publicData())`
  - Return `response()->json(['success' => true, 'data' => $data])`
- [ ] Add `use App\Http\Controllers\SiteSettingsController;` to routes/api.php
- [ ] Add route in public v1 group: `Route::get('/site-settings', [SiteSettingsController::class, 'index'])->name('site-settings.public');`
- [ ] NO middleware on this route

**Files:** `app/Http/Controllers/SiteSettingsController.php`, `routes/api.php`
**Verify:**
- `php artisan route:list --name=site-settings` → no middleware
- A1 + A4c tests GREEN

---

## Task 4: Hook cache invalidation into admin write
**Size:** XS | **Dependencies:** Task 1, Task 3

- [ ] In `app/Http/Controllers/Admin/SettingController.php` `update()`, after `updateOrCreate` loop:
  ```php
  Setting::forgetPublicCache();
  ```
- [ ] Unconditional call (before return statement)

**Files:** `app/Http/Controllers/Admin/SettingController.php`
**Verify:**
- `php artisan test --filter=SiteSettingsPublicTest` → ALL GREEN
- `php artisan test --filter=ContactAndSettingsTest` → still GREEN

---

## Checkpoint: After Tasks 1-4
- [ ] `php artisan test` full suite green
- [ ] `php artisan route:list --name=site-settings` — no middleware shown
- [ ] Manual smoke: PUT as admin → `Cache::has` false → GET returns new value
- [ ] `php artisan test --filter=SiteSettingsPublicTest` → all 9 pass

---

## Task 5: Regression pass
**Size:** XS | **Dependencies:** Task 4

- [ ] `php artisan test` — full suite green
- [ ] `php artisan route:list` — no stray routes
- [ ] `composer dump-autoload -o` — zero PSR-4 warnings

---

## Task 6 (OPTIONAL — go/no-go): Banner upload endpoint
> Default: NO-GO. Requires AWS S3 creds + Storage::fake setup. Skip unless approved.

- [ ] `POST /api/v1/admin/settings/banner` (auth:api + permission:manage settings)
- [ ] `StoreSettingBannerRequest` — validates image (mimes:jpg,png,webp; max:5120)
- [ ] `Storage::disk('s3')->putFile('settings/banners', $file)` → `updateOrCreate('homepage_banner', $url)`
- [ ] `Setting::forgetPublicCache()` after upsert
- [ ] Test A5: Storage::fake + valid image → 200; invalid → 422; non-admin → 403

---

## Acceptance Matrix

| ID  | Scenario                          | Expected                         | Task |
|-----|-----------------------------------|----------------------------------|------|
| A1a | GET with whitelisted rows seeded  | 200, data = whitelisted keys only | T3   |
| A1b | Non-whitelisted key in DB         | Absent from data                 | T3   |
| A1c | Empty settings table              | 200 {success:true,data:{}}       | T3   |
| A2  | Two sequential GETs               | Same JSON, 1 DB query            | T3   |
| A3a | Admin PUT                         | Cache::has = false               | T4   |
| A3b | GET after admin PUT               | Returns new value                | T4   |
| A4a | Unauthenticated PUT               | 401                              | existing |
| A4b | Non-admin PUT                     | 403                              | existing |
| A4c | Unauthenticated GET               | 200                              | T3   |
| B   | Full suite                        | All green                        | T5   |
