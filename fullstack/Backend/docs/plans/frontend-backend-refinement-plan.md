# 10-Phase Full-Stack Refinement Plan

The following phases must be executed sequentially to bring the Itinera Admin application to a clean, maintainable, and production-ready state.

## PHASE 1 — Backend Missing Controllers
### Objective
Resolve the FATAL 500 errors occurring on the frontend.
### Exact Changes Required
1. Generate `AdminHotelController`, `AdminRestaurantController`, and `AdminCountryController` in the `App\Http\Controllers\Admin` namespace.
2. Implement `index`, `store`, `show`, `update`, `destroy` in each using `paginate(15)`.
3. Move `AdminAttractionController` into the `Admin` namespace and update `api.php`.

## PHASE 2 — Strict Validation Guard
### Objective
Close critical security holes in mass-assignment.
### Exact Changes Required
1. Generate `StoreUserRequest` and `UpdateUserRequest`. Apply to `AdminUserController`.
2. Generate `StoreTripRequest` and `UpdateTripRequest`.
3. Audit `AuthController@register` to ensure `$request->phone` is validated before creation.

## PHASE 3 — API Contract Standardization (Backend)
### Objective
Ensure every API endpoint returns a uniform JSON structure.
### Exact Changes Required
1. Remove all manual `response()->json(['data' => ...])` wrappers around ResourceCollections.
2. Return `ResourceCollection` directly so Laravel handles the `data`/`meta`/`links` wrapping consistently.
3. Replace `all()` and `get()` with `paginate(15)` in `AdminUserController` and `AdminTripController`.

## PHASE 4 — Frontend Interceptor & State
### Objective
Remove manual token injection.
### Exact Changes Required
1. Refactor `api.js` to automatically attach `Authorization: Bearer` to all requests targeting `apiBase`.
2. Refactor `api.js` to automatically intercept 401 Unauthorized responses and trigger `session.js` logout.

## PHASE 5 — Global Layout Centralization (Frontend)
### Objective
Eliminate duplicated initialization boilerplate.
### Exact Changes Required
1. Expand `initGlobalUser()` in `admin-chrome.js` to execute on `DOMContentLoaded`.
2. Remove `renderProfile()` and `init()` auth guards from `admin-users.js`, `admin-settings.js`, `admin-trips.js`, `admin-reviews.js`, `admin-analytics.js`, `admin-dashboard.js`.

## PHASE 6 — Universal Data Table Migration
### Objective
Remove redundant DOM-manipulation logic.
### Exact Changes Required
1. Add `users`, `trips`, and `reviews` configuration blocks to the `MODULES` constant inside `admin-crud.js`.
2. Delete `admin-users.js`, `admin-trips.js`, and `admin-reviews.js`.
3. Update HTML files to point to `admin-crud.js`.

## PHASE 7 — Forms & Validation Feedback
### Objective
Standardize how 422 errors are presented.
### Exact Changes Required
1. Ensure the frontend `admin-crud.js` properly mounts `validation.js` handlers on dynamically generated edit/create modals.
2. Test end-to-end to verify that Laravel FormRequest errors highlight the exact input fields in the frontend modals.

## PHASE 8 — Empty & Loading States
### Objective
Graceful degradation when databases have no data.
### Exact Changes Required
1. Implement skeleton loaders globally across all charts in `admin-analytics.js`.
2. Ensure the backend returns `[]` (empty array) instead of `404` or `500` when relationships are empty (e.g. trips with no items).

## PHASE 9 — Security & Performance Hardening
### Objective
Protect against N+1 queries and XSS.
### Exact Changes Required
1. Add `with(['user', 'destinations'])` to `Trip::paginate(15)` to prevent N+1 queries.
2. Add `with(['roles'])` to `User::paginate(15)`.
3. Document moving the JWT token from `localStorage` to an HttpOnly Secure cookie for the final production deployment.

## PHASE 10 — End-to-End Verification
### Objective
Final regression sweep.
### Exact Changes Required
1. Manually test every CRUD capability (Create, Read, Update, Delete) from the frontend UI all the way to the database.
2. Run Laravel PHPUnit feature tests to freeze the API contracts.