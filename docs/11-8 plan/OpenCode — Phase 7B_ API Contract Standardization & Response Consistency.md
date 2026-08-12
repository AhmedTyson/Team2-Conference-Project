# OpenCode — Phase 7B: API Contract Standardization & Response Consistency

## 0. PURPOSE

Phase 7 audit and initial remediation are complete.

Current verified state:

- 257 tests passing
- 900 assertions
- 0 failures
- 0 regressions
- RestaurantController::destroy() error handling fixed
- Create operations standardized to HTTP `201`
- 8 create operations updated
- Phase 7 audit identified approximately **113 endpoints** still using raw `response()->json()`
- API response formats remain inconsistent
- Pagination metadata is inconsistent across list endpoints

The goal of this session is to complete the remaining **API Contract remediation**.

### Remaining Scope

1. Migrate eligible endpoints to the existing `ApiResponse` helpers
2. Standardize success response structure
3. Standardize error response structure
4. Standardize pagination metadata
5. Preserve existing business behavior
6. Preserve authentication/authorization behavior
7. Preserve validation behavior
8. Preserve HTTP semantics where they are already correct
9. Add/update tests for the API contract
10. Verify the entire application after migration

---

# 1. HARD STOP — READ BEFORE MODIFYING

Do NOT start editing controllers immediately.

First inspect:

- `app/Http/Responses/`
- `app/Helpers/`
- `app/Support/`
- `app/Http/Controllers/`
- `app/Http/Resources/`
- `routes/api.php`
- `tests/Feature/`
- `tests/Unit/`

Find the exact implementation and conventions of:

```text
ApiResponse::success()
ApiResponse::fail()
```

Do not assume their signatures.

Do not create a second response helper if one already exists.

Do not replace `ApiResponse` with a new abstraction.

---

# 2. BASELINE

Before making any changes run:

```bash
php artisan test
```

Record:

- tests
- assertions
- failures
- duration

Expected baseline:

```text
257 tests
900 assertions
0 failures
```

If the baseline differs, investigate before continuing.

Do not treat an already-existing failure as caused by this phase.

---

# 3. BUILD A COMPLETE API CONTRACT INVENTORY

Before implementation, enumerate all API endpoints.

Inspect:

```bash
php artisan route:list --path=api
```

For every endpoint record:

| Method | URI | Controller | Action | Auth | Success Shape | Error Shape | Pagination | Current Helper |
|---|---|---|---|---|---|---|---|---|

Also identify:

- public endpoints
- authenticated endpoints
- admin endpoints
- agency endpoints
- user endpoints
- endpoints with policies
- endpoints with validation
- endpoints returning resources
- endpoints returning collections
- paginated endpoints
- endpoints returning empty responses
- endpoints performing deletes
- endpoints performing updates
- endpoints performing creation

Do not assume the audit's `~113` count is still exact.

Recalculate it from the current codebase.

---

# 4. UNDERSTAND ApiResponse FIRST

Inspect the actual implementation.

Determine:

### Success contract

For example, if the existing helper produces something like:

```json
{
    "success": true,
    "message": "...",
    "data": {}
}
```

document the actual structure.

### Error contract

Determine whether errors currently look like:

```json
{
    "success": false,
    "message": "...",
    "errors": {}
}
```

or another format.

### Pagination contract

Determine whether `ApiResponse` already supports pagination.

If it does, use it.

If it does not, determine whether pagination metadata belongs in:

```json
data
```

or:

```json
meta
```

based on existing project conventions.

Do NOT invent a new response format without first checking the existing implementation.

---

# 5. DEFINE THE TARGET CONTRACT

Create a documented target contract before mass migration.

The API should consistently distinguish:

## Success

```text
success
message
data
```

## Validation failure

```text
success
message
errors
```

## Authorization failure

```text
success
message
```

## Not found

```text
success
message
```

## Server failure

```text
success
message
```

Use the project's existing `ApiResponse` implementation whenever possible.

The exact property names must come from the existing helper and current project conventions.

Do not introduce duplicate structures.

---

# 6. HTTP STATUS CODE RULES

Standardize status codes according to HTTP semantics.

### GET successful retrieval

```text
200 OK
```

### Successful creation

```text
201 Created
```

### Successful update

```text
200 OK
```

### Successful deletion

Use the project's established convention:

```text
200 OK
```

or

```text
204 No Content
```

Do not switch DELETE responses to `204` if doing so would break the project's response contract.

### Validation

```text
422 Unprocessable Entity
```

### Authentication failure

```text
401 Unauthorized
```

### Authorization failure

```text
403 Forbidden
```

### Resource not found

```text
404 Not Found
```

### Conflict

Use:

```text
409 Conflict
```

only when the application genuinely has a conflict condition.

### Server failure

```text
500 Internal Server Error
```

Do not change status codes merely for cosmetic consistency.

---

# 7. MIGRATE RAW response()->json()

Search the entire application for:

```text
response()->json(
return response()->json(
```

Classify every occurrence.

### Category A — Must migrate

Application API responses with no special reason to bypass `ApiResponse`.

### Category B — Review carefully

Responses involving:

- file downloads
- streams
- external API passthrough
- webhooks
- special content types
- binary responses
- third-party protocol requirements

### Category C — Do not migrate

Responses where using `ApiResponse` would violate the required protocol.

Document every Category B/C decision.

Do not mechanically replace all `response()->json()` calls.

---

# 8. SUCCESS RESPONSES

Migrate eligible controllers from inconsistent formats such as:

```php
return response()->json([
    'message' => 'Success',
    'data' => $data,
]);
```

or:

```php
return response()->json($data);
```

to the existing project-standard:

```php
return ApiResponse::success(...);
```

using the actual helper signature discovered in Step 4.

Preserve:

- existing data
- existing relationships
- existing resource transformations
- existing messages where meaningful
- existing HTTP status semantics

Do not alter business logic.

---

# 9. ERROR RESPONSES

Find inconsistent error responses such as:

```php
return response()->json([
    'error' => 'Something went wrong'
], 500);
```

or:

```php
return response()->json([
    'message' => 'Unauthorized'
], 403);
```

Migrate eligible responses to:

```php
ApiResponse::fail(...)
```

using the actual implementation.

Standardize:

- message field
- validation error representation
- HTTP status
- success/error indicator

Do NOT expose:

- stack traces
- SQL errors
- internal filesystem paths
- secrets
- tokens
- payment credentials
- raw gateway payloads
- sensitive exception details

---

# 10. EXCEPTION HANDLING

Audit controllers containing:

```php
try {
    ...
} catch (\Throwable $e) {
    ...
}
```

Verify that error responses:

- use the API contract
- return correct HTTP status
- do not leak internal exception details
- log safely when appropriate

Do not add `try/catch` everywhere.

Do not catch exceptions merely to convert them into generic responses if Laravel's global exception handling already handles the case correctly.

---

# 11. PAGINATION STANDARDIZATION

Find every endpoint using:

```php
paginate()
simplePaginate()
cursorPaginate()
```

and every endpoint manually implementing:

```text
page
per_page
current_page
total
last_page
```

Build an inventory.

For each paginated endpoint determine:

- current request parameter
- default page size
- maximum page size
- current page
- total
- last page
- per-page
- next/previous links if applicable

Standardize the response metadata.

Preferred conceptual shape:

```json
{
    "success": true,
    "message": "...",
    "data": [...],
    "meta": {
        "current_page": 1,
        "per_page": 15,
        "total": 100,
        "last_page": 7
    }
}
```

But use the actual project's established contract if one already exists.

Do not break Laravel paginator semantics.

---

# 12. PAGINATION INPUT VALIDATION

For endpoints accepting:

```text
page
per_page
```

ensure:

```text
page >= 1
per_page >= 1
per_page <= reasonable maximum
```

Do not allow arbitrary huge page sizes.

Use existing validation conventions.

Do not introduce a global pagination abstraction unless the existing architecture already supports one.

---

# 13. API RESOURCES

Before manually standardizing controller response data, inspect:

```text
app/Http/Resources/
```

If an endpoint already uses:

```php
JsonResource
ResourceCollection
```

do not destroy that structure.

The goal is:

```text
ApiResponse
    +
Laravel Resource
```

when appropriate.

Do not duplicate transformation logic in controllers.

---

# 14. CONTROLLER RESPONSIBILITY

While migrating responses, do NOT perform unrelated controller refactoring.

Do not introduce:

- repositories
- DTOs
- services
- interfaces
- new architecture layers
- dependency injection redesign
- unrelated naming refactors

Only make changes required to establish the API contract.

If an existing controller contains obvious unrelated technical debt:

document it, but do not fix it in this phase.

---

# 15. SPECIAL ENDPOINTS

Pay special attention to:

### Authentication

Login/register/logout/refresh/password endpoints.

Verify:

```text
401
403
422
200
201
```

remain correct.

### Payment

Do not change payment/webhook protocol responses without verifying gateway requirements.

### Webhooks

Do not wrap third-party-required webhook responses in `ApiResponse` unless the webhook contract permits it.

### AI endpoints

Preserve:

- quota behavior
- authorization
- caching
- external API behavior

### Maps

Preserve:

- rate limiting
- authorization
- caching
- geocoding behavior

### Admin endpoints

Ensure pagination and error contracts are consistent.

---

# 16. BACKWARD COMPATIBILITY

The Phase 7 audit already introduced intentional breaking changes:

```text
create operations:
200 → 201
```

These changes are documented.

For the remaining changes:

Do not introduce unnecessary breaking changes.

If a response shape must change:

1. Identify the affected endpoint.
2. Identify existing tests.
3. Document the contract change.
4. Update tests.
5. Record frontend impact.
6. Do not silently change the behavior.

---

# 17. TEST STRATEGY

Create tests around the API contract.

At minimum verify representative endpoints for:

### Success

- GET
- POST
- PUT/PATCH
- DELETE

### Errors

- 401
- 403
- 404
- 422
- 409 where applicable
- 500 where applicable

### Pagination

Verify:

```text
current_page
per_page
total
last_page
```

and custom:

```text
?page=2&per_page=10
```

### Contract shape

Verify:

```text
success
message
data
errors
meta
```

according to the actual target contract.

Do not write 100 duplicate tests if the helper contract can be covered through representative controller tests.

Prefer feature/integration tests for actual HTTP responses.

---

# 18. SECURITY REGRESSION

After migration verify that response standardization does NOT accidentally expose:

- authorization failures as successful responses
- private trip data
- user data
- payment information
- raw exceptions
- SQL errors
- internal IDs unnecessarily
- sensitive gateway payloads

Run the existing security tests.

Especially verify:

```text
SEC-01
SEC-02
SEC-03
SEC-04
SEC-05
SEC-08
SEC-09
SEC-10
SEC-11
SEC-12
```

Do not modify security logic as part of this phase.

---

# 19. PERFORMANCE REGRESSION

Response standardization must not introduce:

- additional queries
- N+1 queries
- unnecessary serialization
- repeated database calls
- duplicated pagination queries

Especially verify:

```text
PERF-01
PERF-02
```

Remain unchanged.

---

# 20. IMPLEMENTATION ORDER

Use this order:

### Step 1

Inventory all API responses.

### Step 2

Understand `ApiResponse`.

### Step 3

Define the target contract.

### Step 4

Migrate low-risk controllers first.

### Step 5

Migrate admin controllers.

### Step 6

Migrate user-facing controllers.

### Step 7

Migrate commerce/payment controllers carefully.

### Step 8

Standardize pagination.

### Step 9

Handle special endpoints individually.

### Step 10

Run focused tests.

### Step 11

Run full test suite.

### Step 12

Re-audit all API responses.

---

# 21. HARD RULE — NO MASS BLIND REPLACEMENT

Do NOT run a global automated replacement such as:

```text
response()->json → ApiResponse::success
```

Every endpoint has different semantics.

Review each endpoint.

The migration must be behavior-preserving.

---

# 22. FINAL SEARCH

After implementation search again for:

```text
response()->json(
```

Produce:

```text
Total occurrences before:
Total occurrences after:
```

For every remaining occurrence provide:

```text
File
Controller
Method
Reason it remains
```

The target is NOT necessarily zero.

The target is:

> Zero unjustified raw API JSON responses.

---

# 23. FINAL API CONTRACT AUDIT

Re-run:

```bash
php artisan route:list --path=api
```

and produce a final inventory:

| Category | Before | After |
|---|---:|---:|
| ApiResponse success | | |
| ApiResponse fail | | |
| Raw JSON | | |
| Special responses | | |
| Paginated endpoints | | |
| Standardized pagination | | |

Also report:

```text
Endpoints audited:
Endpoints migrated:
Endpoints intentionally unchanged:
Raw responses remaining:
Pagination endpoints standardized:
Create endpoints using 201:
```

---

# 24. FULL VERIFICATION

Run:

```bash
php artisan test
```

Expected:

```text
0 failures
0 regressions
```

Record:

- test count
- assertion count
- duration

Then run focused API contract tests.

If the test count increases legitimately, explain why.

---

# 25. FINAL REPORT

Create:

```text
docs/11-8 plan/Phase 7 - API Contract Remediation - Final Report.md
```

The report MUST contain:

## A. Baseline

Tests, assertions, failures, duration.

## B. API Inventory

Total API endpoints and response patterns.

## C. ApiResponse Analysis

Existing helper behavior and final contract.

## D. Migration Results

Before/after counts.

## E. Pagination

Before/after pagination consistency.

## F. HTTP Status Codes

All standardized statuses.

## G. Breaking Changes

Explicitly document any response contract changes.

## H. Special Endpoints

Webhooks, payments, AI, maps, authentication, etc.

## I. Tests

Focused + full suite.

## J. Security Regression

SEC-01 through SEC-12 where applicable.

## K. Performance Regression

PERF-01 and PERF-02.

## L. Remaining Exceptions

Every intentionally retained raw response.

## M. Phase 7 Status

State:

```text
PHASE 7 COMPLETE
```

only if all justified API contract work is complete.

Otherwise state exactly what remains.

---

# 26. CRITICAL ARCHITECTURAL RULE

The final architecture should be:

```text
Controller
    ↓
Business Logic
    ↓
Resource / Data Transformation
    ↓
ApiResponse
    ↓
HTTP Response
```

Do NOT make controllers responsible for inventing different response contracts endpoint-by-endpoint.

The API contract should be predictable for frontend consumers.

---

# 27. DO NOT TOUCH PHASE 8

Phase 8 is final verification.

Do NOT begin Phase 8.

Do NOT perform broad unrelated cleanup.

Do NOT modify:

- payment architecture
- authentication architecture
- database architecture
- performance architecture
- business rules

unless required to preserve the API contract during this phase.

---

# 28. SUCCESS CRITERIA

Phase 7 can be considered complete only when:

- [ ] All API endpoints audited
- [ ] `ApiResponse` implementation understood and reused
- [ ] Eligible success responses standardized
- [ ] Eligible error responses standardized
- [ ] HTTP status codes semantically correct
- [ ] Pagination metadata standardized
- [ ] Raw JSON responses reviewed
- [ ] Remaining raw responses justified
- [ ] No security regressions
- [ ] No performance regressions
- [ ] Existing business logic unchanged
- [ ] Focused API contract tests pass
- [ ] Full test suite passes
- [ ] Final report created
- [ ] Phase 8 remains untouched

## FINAL RULE

Do not optimize for "changing the most files."

Optimize for:

> **one predictable API contract across the Laravel application without changing business behavior.**