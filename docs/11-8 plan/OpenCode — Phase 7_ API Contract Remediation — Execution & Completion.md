# OpenCode — Phase 7: API Contract Remediation — Execution & Completion

## 0. OBJECTIVE

Phase 7 — API Contract Remediation is already audited and partially implemented.

The existing audit identified approximately:

- 155 API endpoints
- ~78% currently use raw `response()->json()`
- ~22% already use `ApiResponse::success()` / `ApiResponse::fail()`
- RestaurantController error handling was fixed
- Create-operation HTTP status codes were standardized to `201`
- 257 tests currently pass with 0 failures

Your task now is to **complete Phase 7 only**.

The goal is:

> Establish one predictable, consistent Laravel API response contract across the application WITHOUT changing business behavior.

Do NOT begin Phase 8.

---

# 1. CURRENT STATE — DO NOT REVERSE

The following changes have already been completed and MUST remain intact:

### Restaurant error handling

`RestaurantController::destroy()` now has appropriate error handling.

Do not revert it.

### Create HTTP status codes

The following create operations were changed from:

```text
200 → 201
```

These changes are intentional API-contract changes.

Do not revert them merely to preserve the old behavior.

Verify their tests and document frontend impact.

### Existing Phase 1–6 protections

Do NOT break:

- SEC-01 blocked-user enforcement
- SEC-02 trip IDOR protection
- SEC-03 maps rate limiting
- SEC-04 trip fork authorization
- SEC-05 payment sensitive-data protection
- SEC-06 / SEC-07 production hardening
- SEC-08 checkout abuse protection
- SEC-09 pending-order lifecycle
- SEC-10 subscription expiry
- SEC-11 AI quota behavior
- SEC-12 GET side-effect protection
- DB-02 active subscription uniqueness
- PERF-01 admin analytics optimization
- PERF-02 agency pagination

---

# 2. HARD SCOPE BOUNDARY

This session is ONLY:

- API response contracts
- ApiResponse usage
- HTTP response semantics
- pagination metadata
- API error formatting
- API Resources where necessary
- API contract tests
- documentation

Do NOT introduce:

- repositories
- DTOs
- new service layers
- architectural rewrites
- authentication redesign
- payment redesign
- database changes
- business-rule changes
- performance refactors
- new design patterns
- unrelated cleanup

If unrelated problems are discovered:

> DOCUMENT THEM — DO NOT FIX THEM.

---

# 3. READ BEFORE MODIFYING

Read and understand:

```text
app/Support/ApiResponse.php
app/Http/Resources/
app/Http/Controllers/
routes/api.php
docs/11-8 plan/Phase 7 - API Contract Remediation - Audit Report.md
docs/11-8 plan/Phase 7 - API Contract Remediation - Final Report.md
```

Also inspect the existing tests related to API responses.

Understand exactly how `ApiResponse::success()` and `ApiResponse::fail()` behave before migrating anything.

Do NOT invent a new response helper if the existing implementation is sufficient.

---

# 4. TARGET API CONTRACT

Use the existing `ApiResponse` implementation as the source for the actual project contract.

The intended structure is generally:

### Success

```json
{
    "success": true,
    "message": "...",
    "data": {}
}
```

### Error

```json
{
    "success": false,
    "message": "...",
    "errors": {}
}
```

### Paginated response

```json
{
    "success": true,
    "message": "...",
    "data": [],
    "meta": {
        "current_page": 1,
        "per_page": 15,
        "total": 100,
        "last_page": 7
    }
}
```

However:

> Do NOT force these structures blindly if `ApiResponse` already defines a slightly different valid project convention.

The implementation of `ApiResponse` is authoritative for how the helper should be called.

---

# 5. INVENTORY FIRST

Before editing controllers, generate a current inventory.

Search for:

```text
response()->json(
return response()->json(
JsonResponse
ApiResponse::
```

Also inspect:

```text
return [
return response(
return $model
```

where these occur inside API controllers.

Build an internal classification:

### Category A — MUST MIGRATE

Raw JSON responses that clearly represent normal API success/error responses and should follow the common contract.

### Category B — REVIEW INDIVIDUALLY

Responses involving:

- file downloads
- streaming
- external gateway callbacks
- webhook responses
- special protocol requirements
- framework-specific responses
- unusual content types

### Category C — DO NOT MIGRATE

Responses where wrapping would be incorrect or would break a required protocol.

For every Category B/C occurrence, document:

```text
File
Controller
Method
Current response
Reason for keeping it
```

---

# 6. IMPORTANT — NO MASS REPLACEMENT

NEVER perform a global replacement such as:

```text
response()->json(...)
→
ApiResponse::success(...)
```

This is forbidden.

Each endpoint must be reviewed individually.

Preserve:

- existing data
- relationships
- eager loading
- transformations
- pagination
- messages
- status codes
- authorization
- business logic
- exceptions
- caching
- quotas

The migration must be behavior-preserving except for the intentional API-contract changes.

---

# 7. MIGRATE SUCCESS RESPONSES

For eligible endpoints, migrate:

```php
return response()->json(...);
```

to the existing:

```php
ApiResponse::success(...)
```

Preserve the original payload.

Example:

```php
return response()->json([
    'message' => 'Restaurant created successfully',
    'data' => $restaurant,
], 201);
```

must become the equivalent project-standard response using `ApiResponse`.

Do NOT accidentally:

- remove relationships
- rename fields
- remove fields
- alter serialization
- change pagination
- change status codes
- change query behavior

---

# 8. MIGRATE ERROR RESPONSES

Eligible controller errors should use:

```php
ApiResponse::fail(...)
```

Standardize:

- `success`
- `message`
- `errors`
- HTTP status

Typical semantics:

```text
401 → unauthenticated
403 → authenticated but unauthorized
404 → resource not found
409 → conflict
422 → validation/business validation
500 → unexpected server failure
```

Do NOT expose:

- stack traces
- SQL errors
- database connection details
- filesystem paths
- internal exceptions
- secrets
- JWTs
- payment credentials
- gateway credentials
- raw payment payloads

---

# 9. EXCEPTION HANDLING

Audit existing controller `try/catch` blocks.

Do NOT add `try/catch` everywhere.

For existing catches:

- ensure the response follows the API contract
- preserve logging behavior
- preserve status semantics
- do not expose internal exception details

If Laravel's global exception handling already handles a case correctly, do not duplicate it inside controllers.

---

# 10. HTTP STATUS CODES

Do not change status codes merely for cosmetic consistency.

Use semantically correct HTTP statuses.

Expected conventions:

```text
GET success      → 200
POST create      → 201
PUT/PATCH        → 200
DELETE           → 200 or 204
Validation       → 422
Unauthenticated  → 401
Unauthorized     → 403
Not found        → 404
Conflict         → 409
Server error     → 500
```

The existing Phase 7 `200 → 201` changes are intentional and must remain.

Before changing any additional status code:

1. Verify endpoint semantics.
2. Check tests.
3. Check whether frontend compatibility is affected.
4. Only change when justified.

Avoid unnecessary breaking changes.

---

# 11. PAGINATION STANDARDIZATION

Inventory every paginated API endpoint.

Look for:

```php
paginate()
simplePaginate()
cursorPaginate()
```

and manually constructed pagination responses.

Standardize pagination metadata where appropriate:

```json
"meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 100,
    "last_page": 7
}
```

Preserve:

- pagination query behavior
- page number
- per-page limits
- filtering
- sorting
- relationships

Do NOT change pagination strategy unless required for the contract.

---

# 12. PAGINATION INPUT VALIDATION

For endpoints accepting:

```text
page
per_page
```

verify:

```text
page >= 1
per_page >= 1
per_page <= reasonable maximum
```

Do not allow:

```text
per_page=999999999
```

Do not blindly add validation to endpoints where Laravel already provides appropriate protection.

Reuse existing validation conventions where possible.

---

# 13. API RESOURCES

Inspect:

```text
app/Http/Resources/
```

If a Laravel Resource already exists:

> Reuse it.

Do not duplicate transformation logic inside controllers.

Target relationship:

```text
Controller
   ↓
Business logic
   ↓
Resource / transformation
   ↓
ApiResponse
   ↓
HTTP response
```

Do not create Resources simply for the sake of increasing abstraction.

Only introduce one when it is genuinely required to prevent duplicated or inconsistent response transformation.

---

# 14. SPECIAL ENDPOINTS

Treat these separately.

## Authentication

Verify:

```text
401
403
422
200
201
```

and ensure no user/account enumeration leaks.

## Payments

Preserve:

- gateway requirements
- payment identifiers
- webhook behavior
- idempotency
- sensitive-data protections

Do NOT expose sensitive payment data.

## Webhooks

Do not wrap webhook responses if the external provider requires a specific response format.

Document the decision.

## AI

Preserve:

- authorization
- quota consumption
- caching
- trip ownership
- external API behavior

Especially verify SEC-11.

## Maps

Preserve:

- authorization
- rate limiting
- caching
- geocoding behavior

Especially verify SEC-02 and SEC-03.

## Admin

Ensure:

- pagination consistency
- authorization responses
- standardized errors
- standardized success responses

---

# 15. BREAKING-CHANGE CONTROL

Phase 7 already introduced:

```text
POST create:
200 → 201
```

Document this.

Do NOT introduce additional breaking response changes unless necessary.

Do not:

- rename response fields
- remove response fields
- change data types
- remove metadata
- change pagination semantics

unless explicitly required by the API contract and properly tested.

---

# 16. TESTING STRATEGY

Before continuing implementation:

```bash
php artisan test
```

Record:

```text
tests
assertions
failures
duration
```

Expected current baseline:

```text
257 tests
900 assertions
0 failures
```

Do not assume these exact numbers if the repository legitimately differs. Record the actual baseline.

---

# 17. ADD FOCUSED API CONTRACT TESTS

Add tests only where coverage is missing.

Cover representative:

### Success

```text
GET  → 200
POST → 201
PUT/PATCH → 200
DELETE → 200/204
```

### Errors

```text
401
403
404
409
422
500
```

### Pagination

Verify:

```text
success
message
data
meta
current_page
per_page
total
last_page
```

### Contract

Verify that responses do not accidentally contain:

```text
stack traces
SQL errors
internal paths
secrets
tokens
payment credentials
raw gateway payloads
```

Do not create hundreds of duplicate tests.

Prefer representative integration/feature tests plus targeted coverage for unusual endpoints.

---

# 18. SECURITY REGRESSION

After migration, explicitly verify:

```text
SEC-01
SEC-02
SEC-03
SEC-04
SEC-05
SEC-06
SEC-07
SEC-08
SEC-09
SEC-10
SEC-11
SEC-12
```

Response standardization must NOT:

- turn 403 into 200
- expose private trip data
- expose another user's resources
- expose blocked-user information
- expose payment information
- expose raw exceptions
- expose SQL errors
- bypass authorization
- bypass rate limits
- change quota behavior

---

# 19. PERFORMANCE REGRESSION

Do not introduce:

- additional database queries
- N+1 queries
- unnecessary serialization
- duplicate Resource transformations
- repeated relationship loading

Verify:

```text
PERF-01
PERF-02
```

remain unchanged.

Response formatting should not materially alter query behavior.

---

# 20. IMPLEMENTATION ORDER

Follow this order:

### Step 1

Understand `ApiResponse`.

### Step 2

Create complete endpoint/response inventory.

### Step 3

Classify all raw JSON responses.

### Step 4

Migrate low-risk controllers.

### Step 5

Migrate admin controllers.

### Step 6

Migrate user-facing controllers.

### Step 7

Migrate commerce/payment controllers carefully.

### Step 8

Handle authentication/special endpoints.

### Step 9

Standardize pagination.

### Step 10

Add focused contract tests.

### Step 11

Run targeted tests.

### Step 12

Run full suite.

### Step 13

Perform final raw-response search.

### Step 14

Re-audit every remaining exception.

---

# 21. FINAL SEARCH

After implementation, run searches again.

Determine:

```text
Raw response()->json() before
Raw response()->json() after
```

For every remaining raw response:

```text
File
Controller
Method
Category
Reason it remains
```

Do NOT report "0 raw JSON responses" unless that is actually true.

The goal is:

> Every eligible response follows the standard contract.

Not:

> Every occurrence must disappear.

---

# 22. FINAL API INVENTORY

Run:

```bash
php artisan route:list --path=api
```

Create a final inventory containing:

```text
Endpoint
HTTP Method
Controller
Response Type
HTTP Status
Contract
Pagination
Migrated?
Exception?
Reason
```

Ensure all API endpoints have been audited.

---

# 23. FULL VERIFICATION

Run:

```bash
php artisan test
```

Then run appropriate focused API tests.

Required:

```text
0 failures
0 regressions
```

Record:

```text
Tests
Assertions
Failures
Duration
```

Also verify:

```text
SEC-01 → SEC-12
PERF-01
PERF-02
```

where applicable.

---

# 24. FINAL REPORT

Create/update:

```text
docs/11-8 plan/Phase 7 - API Contract Remediation - Final Report.md
```

The report MUST include:

## A. Baseline

Tests, assertions, duration, raw JSON count.

## B. API Inventory

Total endpoints and controllers audited.

## C. ApiResponse Analysis

Existing behavior and target contract.

## D. Migration Results

How many endpoints were:

- migrated
- already compliant
- intentionally unchanged

## E. Raw JSON Results

Before/after counts and every remaining exception.

## F. Pagination

Endpoints audited and standardized.

## G. HTTP Status Codes

Changes made and rationale.

## H. Breaking Changes

Document:

```text
200 → 201
```

and any other unavoidable changes.

## I. Special Endpoints

Authentication, payments, webhooks, AI, maps, admin.

## J. Tests

Focused tests + full suite.

## K. Security Regression

SEC-01 → SEC-12.

## L. Performance Regression

PERF-01 / PERF-02.

## M. Remaining Exceptions

Anything intentionally not migrated and why.

## N. Phase 7 Status

Clearly state:

```text
PHASE 7 COMPLETE
```

ONLY when every success criterion is actually satisfied.

---

# 25. SUCCESS CRITERIA

Phase 7 is complete only when:

- [ ] All API endpoints audited
- [ ] `ApiResponse` implementation understood and reused
- [ ] Eligible success responses standardized
- [ ] Eligible error responses standardized
- [ ] HTTP status codes are semantically correct
- [ ] Pagination metadata is standardized where applicable
- [ ] Pagination input is reasonably constrained
- [ ] Raw JSON responses reviewed individually
- [ ] Every remaining raw response is documented
- [ ] No mass blind replacement was used
- [ ] No business logic was changed
- [ ] No security regression
- [ ] No performance regression
- [ ] Focused API contract tests pass
- [ ] Full test suite passes
- [ ] Final API inventory completed
- [ ] Final report created
- [ ] Phase 8 untouched

---

# 26. HARD STOP — PHASE 8

DO NOT:

- perform final project-wide verification
- close unrelated technical debt
- begin Phase 8
- perform deployment
- perform production infrastructure changes

Phase 8 will perform the final verification separately.

Your responsibility in this session is only:

> Finish Phase 7 API Contract Remediation and leave the codebase ready for Phase 8.

---

# FINAL PRINCIPLE

Do not optimize for:

> "How many files can I change?"

Optimize for:

> "Can a frontend developer reliably predict the structure, status code, pagination metadata, and error format of every Laravel API response without knowing the individual controller implementation?"

The result must be:

```text
Consistent
Predictable
Backward-aware
Secure
Behavior-preserving
Laravel-native
Tested
```

Do not change business behavior merely to make responses look uniform.