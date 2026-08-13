# API Contract Audit & Matrix

## Global Formatting Inconsistency
The Laravel backend returns wildly varying JSON structures depending on the developer who wrote the controller.

**Pattern A (Pagination Wrapped in Data):**
```json
{
  "success": true,
  "data": {
    "current_page": 1,
    "data": [{...}],
    "links": {...}
  }
}
```
*Used by: DestinationController, AdminReviewController*

**Pattern B (Raw Resource Collection):**
```json
{
  "data": [{...}]
}
```
*Used by: AdminUserController, AdminTripController (No pagination)*

**Pattern C (Double-Wrapped Array):**
```json
{
  "success": true,
  "data": {
    "data": [{...}] // Actually wrapped incorrectly in the controller
  }
}
```
*Used by: AdminAttractionController*

## API Contract Matrix

| Endpoint | Backend Definition | Frontend Consumer | Match Status | Issues |
| -------- | ------------------ | ----------------- | ------------ | ------ |
| `GET /user` | `AuthController@me` | `session.js` | ✅ YES | Works correctly |
| `POST /login` | `AuthController@login` | `auth.js` | ✅ YES | Works correctly |
| `POST /logout` | `AuthController@logout` | `session.js` | ✅ YES | Works correctly |
| `GET /v1/admin/users` | `AdminUserController@index` | `admin-users.js` | ❌ NO | Backend returns unpaginated array; frontend expects pagination metadata. |
| `POST /v1/admin/users` | `AdminUserController@store` | `admin-users.js` | ❌ NO | Backend accepts any input (missing validation). |
| `GET /v1/admin/trips` | `AdminTripController@index` | `admin-trips.js` | ❌ NO | Backend returns unpaginated raw ResourceCollection. |
| `GET /v1/admin/destinations` | `Admin\DestinationController@index` | `admin-crud.js` | ✅ YES | Contract strictly followed. |
| `GET /v1/admin/hotels` | `AdminHotelController@index` | `admin-crud.js` | ❌ FATAL | Controller is empty. 500 Server Error. |
| `GET /v1/admin/restaurants` | `AdminRestaurantController@index` | `admin-crud.js` | ❌ FATAL | Controller file does not exist. 500 Server Error. |
| `GET /v1/admin/countries` | `AdminCountryController@index` | `admin-crud.js` | ❌ FATAL | Controller file does not exist. 500 Server Error. |
| `GET /v1/admin/attractions`| `AdminAttractionController@index` | `admin-crud.js` | ⚠️ WARN | Wrong namespace, double-wrapped JSON response. |
| `GET /v1/admin/reviews` | `AdminReviewController@index` | `admin-reviews.js` | ✅ YES | Contract followed. |

## Recommended Standard Contract
All API endpoints must be refactored to return standard Laravel `ResourceCollection` responses without manual `response()->json()` array building. 

```php
// Backend Recommendation
return UserResource::collection(User::paginate(15));
```

```javascript
// Frontend Expectation
const data = res.body.data;
const meta = res.body.meta; // pagination details
```
---

## Agency Assignment API (Phase 7)

All routes: `auth:api`, prefix `/api/v1`. Success envelope `{ "data": {...} }`. Errors: 401 unauthenticated, 403 `{ "error": { "status": 403, ... } }` (ApiExceptionHandler), 422 validation.

| Method | Path | Role | Body | Response |
|---|---|---|---|---|
| POST | `/agency-requests` | any authenticated | `{ budget_level?: "low"\|"medium"\|"high"\|"luxury" }` | 201 `AgencyAssignment` (status `requested`) |
| POST | `/admin/agency-requests/{id}/approve` | `admin`/`super_admin` | `{ agency_user_id: int }` | 200 (status `admin_approved`, sets `admin_id`, `agency_user_id`, `admin_approved_at`) |
| POST | `/agency/assignments/{id}/approve` | `agency` (must own) | — | 200 (status `agency_approved`, sets `agency_responded_at`) |
| POST | `/agency/assignments/{id}/decline` | `agency` (must own) | — | 200 (status `agency_declined`) |
| POST | `/agency/assignments/{id}/trips` | `agency` (view policy) | `{ title: string, items?: [{ type: "App\Models\Catalog\Hotel"\|"hotel"\|"restaurant"\|"flight"\|"attraction"\|"destination", id: int }] }` | 201 `Trip` (status `pending`, `user_id` = assignment customer, defaults: `travel_style=custom`, `no_of_travelers=1`, budget by level, dates now+7/+14) |
| GET | `/agency/assignments` | `agency` | — | 200 array of own assignments with `customer` + `trips` |

`AgencyAssignment` shape: `{ id, customer_id, agency_user_id, admin_id, budget_level, status, admin_approved_at, agency_responded_at, created_at, updated_at }`.
Status flow: `requested → admin_approved → agency_approved | agency_declined`, plus terminal `completed`, `cancelled`.
