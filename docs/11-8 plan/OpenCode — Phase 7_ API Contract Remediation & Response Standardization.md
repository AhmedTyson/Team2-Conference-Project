# OpenCode — Phase 7: API Contract Remediation & Response Standardization

## 0. PURPOSE

Phase 7 audit is complete.

The audit found:

- 155 API endpoints analyzed
- ~78% currently use raw `response()->json()`
- ~22% use the project's `ApiResponse::success()` / `ApiResponse::fail()` helpers
- 3 critical API-contract issues identified
- Pagination metadata is inconsistent across endpoints
- Create operations use inconsistent HTTP status codes
- `RestaurantController::destroy()` lacks proper error handling
- Full remediation audit is documented in:

`docs/11-8 plan/Phase 7 - API Contract Remediation - Audit Report.md`

This session is now the **implementation phase for API contract remediation**.

### Primary objectives

1. Fix critical response/error-handling issues.
2. Standardize API response envelopes where appropriate.
3. Standardize HTTP status codes.
4. Standardize pagination metadata.
5. Migrate eligible controllers to the existing `ApiResponse` helpers.
6. Preserve existing business logic.
7. Preserve authorization and security behavior.
8. Preserve validation behavior.
9. Preserve frontend/API compatibility where the current contract is already intentional.
10. Add regression tests for all changed contracts.

---

# 1. HARD STOP — READ BEFORE MODIFYING

Do NOT immediately start editing controllers.

First inspect:

```text
docs/11-8 plan/Phase 7 - API Contract Remediation - Audit Report.md
app/Http/Responses/
app/Helpers/
app/Support/
app/Http/Controllers/
app/Http/Resources/
routes/api.php
tests/
```

Locate the actual implementation of:

```text
ApiResponse::success()
ApiResponse::fail()
```

Do not assume their exact namespace, signature, or response structure.

Determine:

- success response structure
- error response structure
- HTTP status handling
- validation error handling
- pagination support
- whether metadata is supported
- whether messages are always included
- whether `data` is always present
- whether `errors` is supported
- whether existing clients depend on the current format

The existing helper is the starting point.

Do NOT create a second response abstraction if one already exists.

---

# 2. BASELINE

Before modifying code, run:

```bash
php artisan test
```

Record:

```text
Tests:
Assertions:
Failures:
Duration:
```

Expected recent baseline:

```text
257 tests
900 assertions
0 failures
```

Do not assume the exact numbers if the repository has changed.

The baseline must come from the actual test run.

---

# 3. READ THE COMPLETE PHASE 7 AUDIT

Read:

```text
docs/11-8 plan/Phase 7 - API Contract Remediation - Audit Report.md
```

Extract every endpoint classified by the audit into:

```text
A — Safe to standardize
B — Requires compatibility review
C — Intentionally custom response
D — Critical bug
```

Do not invent additional scope before completing this classification.

---

# 4. API CONTRACT — ESTABLISH THE CANONICAL FORMAT

Determine the project's existing canonical `ApiResponse` format.

For example, if the current helper establishes something similar to:

```json
{
    "success": true,
    "message": "...",
    "data": {}
}
```

and:

```json
{
    "success": false,
    "message": "...",
    "errors": {}
}
```

use the actual implementation found in the repository.

Do NOT redesign the response envelope unless the audit proves the existing helper itself is inadequate.

The objective is:

> Standardize around the existing project convention, not create a new API architecture.

---

# 5. CRITICAL FIX #1 — RestaurantController::destroy()

Inspect:

```text
RestaurantController::destroy()
```

Determine:

- authorization behavior
- model lookup behavior
- validation/business rules
- deletion behavior
- transaction requirements
- exception handling
- current HTTP response
- current API response structure

Fix the missing error handling.

The endpoint must correctly distinguish:

### Successful deletion

Appropriate HTTP status:

```text
200
```

or:

```text
204
```

depending on the project's established API convention.

Do not arbitrarily change it if clients/tests already depend on the existing behavior.

### Not found

Return the project's standard not-found contract.

### Authorization failure

Preserve Laravel authorization behavior.

Do NOT convert a `403` into a generic `500`.

### Expected application/database failure

Return the project's standardized API error response.

Do NOT expose:

- SQL
- stack traces
- filesystem paths
- internal exception messages
- credentials
- provider payloads
- sensitive information

Log the exception through the existing Laravel logging mechanism when appropriate.

Do not introduce a new logging architecture.

---

# 6. CRITICAL FIX #2 — CREATE HTTP STATUS CODES

Audit all create operations.

Identify endpoints performing:

```text
store
create
register
checkout
create resource
```

Determine their current status codes.

The preferred REST convention is:

```text
POST successful resource creation → 201 Created
```

However:

### DO NOT blindly change every POST endpoint.

Some POST endpoints may represent:

- actions
- commands
- authentication
- logout
- payment operations
- AI operations
- searches
- webhooks
- state transitions

These are not necessarily resource creation operations.

Only change endpoints that actually create a resource.

For each changed endpoint:

```text
POST
→ resource created
→ HTTP 201
→ canonical ApiResponse format
```

Preserve:

```text
Location
headers
resource identifiers
existing data payload
```

where applicable.

---

# 7. CRITICAL FIX #3 — RESPONSE STANDARDIZATION

Search the entire API layer for:

```php
response()->json(
```

and equivalent raw JSON response construction.

Classify every occurrence.

Do NOT mechanically replace all of them.

For each occurrence determine:

### Category A — Standard business response

Migrate to:

```text
ApiResponse::success()
ApiResponse::fail()
```

when compatible.

### Category B — Pagination

Migrate to the standardized pagination response.

### Category C — Validation

Preserve Laravel validation semantics unless the project explicitly standardizes validation through `ApiResponse`.

### Category D — Authentication/security response

Preserve required HTTP semantics.

Examples:

```text
401
403
429
```

Do not accidentally turn these into `200`.

### Category E — File/download/stream response

Do NOT convert to JSON.

### Category F — Webhook/external protocol response

Do not modify without verifying protocol requirements.

### Category G — Intentionally custom response

Leave unchanged and document why.

---

# 8. PAGINATION STANDARDIZATION

Audit all paginated endpoints.

Identify responses containing:

```text
current_page
last_page
per_page
total
from
to
data
```

or Laravel paginator structures.

Establish ONE canonical pagination representation based on the existing project's conventions.

For example:

```json
{
    "success": true,
    "message": "...",
    "data": [
        ...
    ],
    "meta": {
        "current_page": 1,
        "last_page": 5,
        "per_page": 15,
        "total": 72,
        "from": 1,
        "to": 15
    }
}
```

But use the actual project convention if one already exists.

Do not invent pagination metadata unnecessarily.

---

# 9. PAGINATION QUERY PARAMETERS

Inspect pagination endpoints for:

```text
page
per_page
```

Determine the project's established limits.

If `per_page` is accepted:

ensure it is validated and bounded.

Do not allow:

```text
per_page=1000000
```

to create a resource exhaustion problem.

Use the project's existing validation/rate-limiting conventions.

Do not change pagination limits globally unless the audit requires it.

---

# 10. LARAVEL PAGINATOR HANDLING

Determine whether the project uses:

```php
paginate()
simplePaginate()
cursorPaginate()
```

Do not destroy Laravel's paginator semantics during response transformation.

Verify:

```text
current_page
last_page
per_page
total
from
to
```

remain correct where applicable.

For cursor pagination, do NOT invent page-based metadata.

Preserve cursor semantics.

---

# 11. ERROR RESPONSE STANDARDIZATION

Audit common errors:

```text
400
401
403
404
409
422
429
500
503
```

Ensure the API does not randomly return different envelopes for equivalent failures.

Preferred conceptual structure:

```json
{
    "success": false,
    "message": "Human-readable message",
    "errors": {}
}
```

Use the actual project's helper format.

### Important

Do NOT expose:

```text
exception class
stack trace
SQL query
database structure
filesystem path
environment variables
provider credentials
raw payment payload
```

Production responses must remain safe.

---

# 12. HTTP STATUS CODE AUDIT

Build a table:

| Operation | Current | Target | Reason |
|---|---:|---:|---|
| GET collection | | 200 | |
| GET resource | | 200 | |
| POST create | | 201 | |
| PUT/PATCH update | | 200/204 | |
| DELETE | | 200/204 | |
| Validation | | 422 | |
| Unauthorized | | 401 | |
| Forbidden | | 403 | |
| Not found | | 404 | |
| Conflict | | 409 | |
| Rate limited | | 429 | |
| Server error | | 500 | |

Do not change a status code merely to make the table look consistent.

Use the semantics of the endpoint.

---

# 13. DO NOT BREAK AUTHORIZATION

During response migration verify that:

```text
Policies
Gates
Middleware
JWT authentication
blocked-user enforcement
ownership checks
```

remain unchanged.

Especially regression-test the security fixes from earlier phases:

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

Do not weaken any security behavior to standardize responses.

---

# 14. DO NOT CHANGE BUSINESS LOGIC

This phase is about:

```text
API contracts
response envelopes
HTTP status codes
pagination
error formatting
```

Do NOT refactor:

```text
services
repositories
domain logic
payment logic
AI quota logic
subscription logic
trip fork logic
authorization rules
database schema
```

unless absolutely required to fix the API contract.

Do not introduce:

```text
DTOs
repositories
interfaces
factories
new service layers
new architecture patterns
```

---

# 15. API RESOURCE CLASSES

Inspect:

```text
app/Http/Resources/
```

If Laravel API Resources already exist:

determine whether they are the project's intended data transformation mechanism.

Do NOT create duplicate transformation systems.

Do not replace API Resources with `ApiResponse` if both serve different purposes.

Correct conceptual separation may be:

```text
Resource
    ↓
data representation

ApiResponse
    ↓
response envelope
```

Only implement this if it matches the existing architecture.

---

# 16. CONTROLLER CLEANUP

For each migrated controller:

Before:

```php
return response()->json(...);
```

After:

```php
return ApiResponse::success(...);
```

only where appropriate.

Do not create artificial one-line wrappers that make the code harder to understand.

Preserve:

- readable controller logic
- existing service calls
- existing validation
- authorization
- exception boundaries

---

# 17. TEST STRATEGY

Before modifying each group:

run its relevant tests.

After modifying:

run focused tests.

At the end:

```bash
php artisan test
```

Add tests only where contract behavior is currently untested.

Required coverage should include:

### Response envelope

- success response
- failure response
- correct status code
- expected data

### Create operations

- successful create returns `201`
- validation still returns `422`

### Destroy

- successful deletion
- not found
- unauthorized/forbidden
- handled application failure

### Pagination

- default page
- custom page
- custom per_page
- pagination metadata
- per_page upper bound

### Error handling

- 401
- 403
- 404
- 422
- 429
- 500 where safely testable

Do not create redundant tests when equivalent coverage already exists.

---

# 18. REGRESSION REQUIREMENT

The full test suite must finish with:

```text
0 failures
0 regressions
```

Record:

```text
Before:
Tests:
Assertions:

After:
Tests:
Assertions:
Failures:
```

If test count increases legitimately, explain why.

Do not manipulate tests to make them pass.

---

# 19. API CONTRACT INVENTORY

Create/update a contract inventory after implementation:

| Endpoint | Method | Response Helper | Status | Pagination | Error Contract | Notes |
|---|---|---|---:|---|---|---|

The inventory should cover all affected endpoints, not necessarily all 155 if unaffected endpoints are explicitly classified.

---

# 20. COMPATIBILITY CHECK

Before changing an existing response, search for consumers inside the repository:

```text
frontend
tests
documentation
API clients
JavaScript fetch calls
Axios calls
```

Determine whether the existing response structure is consumed.

If changing it would break an existing first-party client:

either update the client in the same controlled change

or

document the compatibility impact and do not change it without approval.

Do not silently break the frontend.

---

# 21. IMPLEMENTATION RULE

Every potential change must be classified:

### SAFE TO IMPLEMENT NOW

Clearly improves contract consistency without breaking intended semantics.

### IMPLEMENT WITH COMPATIBILITY UPDATE

Requires coordinated frontend/test/client update.

### KEEP AS-IS

Intentional/custom protocol or response.

### RECOMMEND ONLY

Would require architectural redesign outside Phase 7.

Only implement the first two categories when compatibility is proven.

---

# 22. DO NOT MASS-REWRITE BLINDLY

The audit found approximately 78% raw JSON responses.

That does NOT mean:

> Replace 78% of the code automatically.

Each response must be classified.

The goal is:

> consistent API contracts where consistency is semantically correct.

Not:

> identical code everywhere.

---

# 23. SECURITY REGRESSION CHECK

After implementation explicitly verify:

### Authentication

```text
401 remains 401
```

### Authorization

```text
403 remains 403
```

### Blocked users

```text
blocked token → 403 account_blocked
```

### IDOR protection

```text
unauthorized trip → 403
```

### Rate limiting

```text
429 remains 429
```

### Payment failures

Sensitive payment data must not appear in:

```text
API response
logs
exception messages
```

---

# 24. PERFORMANCE REGRESSION CHECK

Response standardization must NOT introduce:

```text
N+1 queries
additional database queries
duplicate pagination queries
unnecessary serialization
large response transformations
```

For critical endpoints compare query behavior before/after when practical.

Do not introduce API Resources or transformations that trigger unnecessary lazy loading.

---

# 25. FINAL VERIFICATION

Run:

```bash
php artisan test
```

Then inspect:

```bash
git diff --stat
git diff
git status
```

Verify:

- no unrelated files changed
- no migrations changed
- no security logic changed
- no business logic changed
- no sensitive data exposed
- no debugging statements
- no `dd()`
- no `dump()`
- no temporary code
- no commented-out replacement code

---

# 26. REQUIRED FINAL REPORT

Create/update:

```text
docs/11-8 plan/Phase 7 - API Contract Remediation - Final Report.md
```

The final report MUST contain:

## A. Baseline

```text
Tests:
Assertions:
Failures:
```

## B. Audit Findings

Include:

```text
Total endpoints:
Raw JSON:
ApiResponse:
Custom/intentional:
Critical findings:
```

## C. Changes Implemented

For every changed controller/file:

```text
File
Endpoint
Old behavior
New behavior
Reason
Compatibility impact
```

## D. RestaurantController

Document:

```text
destroy()
error handling
status codes
security behavior
tests
```

## E. HTTP Status Standardization

Provide a before/after table.

## F. Response Envelope Standardization

Document:

```text
success
failure
validation
pagination
```

## G. Pagination Standardization

Document:

```text
page
per_page
limits
metadata
cursor endpoints if any
```

## H. Compatibility

Document:

```text
frontend impact
test impact
API client impact
intentional unchanged endpoints
```

## I. Tests

```text
Before:
After:
Assertions:
Failures:
Regressions:
New tests:
```

## J. Security Regression

Explicitly verify:

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

## K. Performance Regression

Confirm no measurable/unintended:

```text
N+1
duplicate queries
pagination regressions
serialization problems
```

## L. Remaining Recommendations

Separate:

```text
Phase 7 remaining
Phase 8
Future
```

Do NOT start Phase 8 automatically.

---

# 27. HARD STOP — PHASE BOUNDARY

This session is ONLY:

```text
PHASE 7 — API CONTRACT REMEDIATION
```

Do NOT implement Phase 8.

Do NOT perform broad production hardening.

Do NOT introduce unrelated security fixes.

Do NOT refactor architecture.

Do NOT modify database migrations.

Do NOT modify business logic.

At completion:

```text
PHASE 7 = IMPLEMENTED
```

and provide the final verification report.

The next phase must remain untouched until explicitly started.