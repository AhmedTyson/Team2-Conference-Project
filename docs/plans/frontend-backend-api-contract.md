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