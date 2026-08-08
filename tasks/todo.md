# Full-Stack Integration Refinement (5-Phase Plan)

## Phase 1: Backend Scaffolding & Security
- [ ] Create `AdminHotelController`, `AdminRestaurantController`, and `AdminCountryController` in `App\Http\Controllers\Admin`.
- [ ] Move `AdminAttractionController` into `App\Http\Controllers\Admin` and update `routes/api.php` namespace.
- [ ] Generate `StoreUserRequest` and `UpdateUserRequest` to secure `AdminUserController` against mass-assignment.
- [ ] Generate `StoreTripRequest` and `UpdateTripRequest` for trips.
- [ ] Audit `AuthController@register` to ensure `$request->phone` is explicitly validated.

## Phase 2: API Contract Standardization & Performance
- [ ] Replace `all()` and `get()` with `paginate(15)` in `AdminUserController` and `AdminTripController`.
- [ ] Remove manual array wrapping (`response()->json(['data' => ...])`) from controllers; return `ResourceCollection` directly.
- [ ] Add eager loading (`with(['user', 'destinations'])`) to `Trip::paginate(15)` to fix N+1 query issues.
- [ ] Add eager loading (`with(['roles'])`) to `User::paginate(15)`.

## Phase 3: Frontend Architecture Core
- [ ] Refactor `api.js` to implement an interceptor pattern (auto-attach `Authorization: Bearer` to all `/api/v1/admin/*` requests).
- [ ] Centralize 401 Unauthorized handling in `api.js` to automatically trigger `session.js` logout.
- [ ] Expand `initGlobalUser()` in `admin-chrome.js` to serve as the single source of truth for Topbar initialization.
- [ ] Delete redundant `renderProfile()` and `init()` calls from all individual page scripts (e.g., `admin-settings.js`, `admin-analytics.js`).

## Phase 4: Frontend UI Consolidation
- [ ] Add configuration blocks for `users`, `trips`, and `reviews` into the `MODULES` constant of `admin-crud.js`.
- [ ] Delete `admin-users.js`, `admin-trips.js`, and `admin-reviews.js`.
- [ ] Update `users.html`, `trips.html`, and `reviews.html` to point exclusively to the unified `admin-crud.js` driver.
- [ ] Verify `validation.js` properly mounts 422 error handlers onto the dynamically generated modals in `admin-crud.js`.

## Phase 5: UX Polish & E2E Verification
- [ ] Implement skeleton loaders globally across all charts in `admin-analytics.js`.
- [ ] Ensure backend APIs safely return empty arrays `[]` instead of 500 errors when relationships or tables are empty.
- [ ] Manually verify end-to-end CRUD (Create, Read, Update, Delete) flows via the browser for all modules.
- [ ] Run Laravel PHPUnit feature tests to cement the final API contracts.
