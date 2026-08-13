# OpenCode — Phase 7: API Contract Remediation & Consistency

## 0. PURPOSE

Phase 6 — Performance Remediation is complete.

Current verified state:

```text
Phase 1 — Security Blockers             COMPLETE
Phase 2 — Payment & Sensitive Data      COMPLETE
Phase 3 — Production Hardening          COMPLETE
Phase 4 — Business Logic                COMPLETE
Phase 5 — Database Integrity             COMPLETE
Phase 5.5 — Architecture Cleanup        COMPLETE
Phase 6 — Performance                  COMPLETE

Phase 7 — API Contract                 NOW STARTING
Phase 8 — Final Verification           NOT STARTED
```

Latest verified baseline:

```text
Tests:       257
Assertions:  900
Failures:    0
Regressions: 0
Duration:    44.62s
```

Do NOT begin Phase 8.

Do NOT reopen completed phases unless Phase 7 verification proves that an existing fix is actually broken.

This phase is focused ONLY on:

- API contract consistency
- HTTP status code correctness
- Response structure consistency
- Validation error consistency
- Resource serialization
- Pagination contract consistency
- Authentication/authorization response consistency
- Error response consistency
- API versioning consistency
- Route/controller contract mismatches
- OpenAPI/documentation consistency if documentation exists
- Tests that verify the public API contract

Do NOT introduce unnecessary architecture.

Do NOT add DTOs, repositories, services, transformers, resources, interfaces, or design patterns merely for theoretical cleanliness.

---

# 1. HARD RULE — AUDIT FIRST

DO NOT immediately modify code.

First inspect the entire API surface.

Run and inspect:

```bash
git status
git log --oneline -20

php artisan route:list --path=api

php artisan test
```

Record the baseline.

Expected baseline:

```text
257 tests
900 assertions
0 failures
```

If the current repository legitimately differs, record the actual baseline and use it.

---

# 2. DISCOVER THE COMPLETE API SURFACE

Inventory:

```text
routes/api.php
routes/*.php
app/Http/Controllers/
app/Http/Requests/
app/Http/Resources/
app/Http/Middleware/
app/Policies/
app/Models/
app/Services/
app/Repositories/
tests/Feature/
tests/Unit/
```

Identify every API endpoint.

Build an inventory:

| Method | URI | Controller | Auth | Permission/Policy | Validation | Response | Status Codes |
|---|---|---|---|---|---|---|---|

Do not assume the list of endpoints.

Discover it from the actual repository.

---

# 3. API VERSIONING AUDIT

Determine the actual versioning strategy.

Check:

```text
/api/v1/...
/api/...
```

Determine:

- Are all intended API routes under the same version?
- Are unversioned routes intentional?
- Are there accidental mixed versions?
- Are route prefixes consistent?
- Are internal/admin endpoints intentionally separated?
- Are authentication endpoints consistent with the versioning strategy?

DO NOT introduce a new versioning strategy.

If the existing strategy is coherent:

> Keep it.

If inconsistency exists:

> Identify exactly which routes violate the established convention.

---

# 4. HTTP METHOD CONTRACT

For every endpoint verify that the HTTP method matches its behavior.

Examples:

```text
GET     → read-only
POST    → create/action
PUT     → full replacement/update where applicable
PATCH   → partial update where applicable
DELETE  → deletion
```

Specifically search for:

- GET endpoints performing writes
- POST endpoints behaving like reads
- DELETE endpoints returning inconsistent semantics
- Incorrect route verbs
- Route aliases that expose unintended methods

SEC-12 was previously fixed.

Do NOT undo the GET purity guarantees.

Verify that Phase 1 behavior remains intact.

---

# 5. HTTP STATUS CODE AUDIT

Audit every controller response.

Look for incorrect or inconsistent use of:

```text
200
201
202
204
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

Determine whether each endpoint returns an appropriate status.

Examples:

### Successful creation

Prefer:

```http
201 Created
```

when a resource is actually created.

### Successful deletion

Consider:

```http
204 No Content
```

if that matches the existing API contract.

### Validation

Prefer:

```http
422 Unprocessable Entity
```

when Laravel validation fails.

### Authentication

Unauthenticated:

```http
401 Unauthorized
```

Do not turn authentication failures into 403.

### Authorization

Authenticated but forbidden:

```http
403 Forbidden
```

Preserve existing:

```text
account_blocked
```

behavior from Phase 1.

### Not found

Missing resources should normally return:

```http
404 Not Found
```

Do not leak internal database exceptions.

### Rate limiting

Preserve:

```http
429 Too Many Requests
```

for throttled endpoints.

Do not replace legitimate rate-limit responses with 500.

---

# 6. RESPONSE STRUCTURE AUDIT

Identify the response format currently used by the application.

For every endpoint determine:

```text
success response
error response
validation response
pagination response
resource response
```

Look for inconsistent structures such as:

```json
{
  "data": {}
}
```

versus:

```json
{
  "success": true,
  "data": {}
}
```

versus:

```json
{
  "message": "...",
  "data": {}
}
```

Do NOT automatically standardize everything.

First determine the actual project convention.

Then identify only genuine contract inconsistencies.

---

# 7. ERROR RESPONSE CONTRACT

Audit:

```text
ValidationException
AuthenticationException
AuthorizationException
ModelNotFoundException
ThrottleRequestsException
HttpException
unexpected Throwable
```

Determine whether clients receive predictable responses.

Check:

- status code
- error identifier/code if used
- message
- validation errors
- field names
- structure
- whether internal exception details leak

Security requirement:

DO NOT expose:

```text
stack traces
SQL queries
database credentials
internal filesystem paths
payment gateway secrets
raw card data
raw webhook payloads
internal exception messages
```

Preserve Phase 2 sensitive-data protections.

---

# 8. VALIDATION CONTRACT

Inspect every API Form Request and inline validation.

Inventory:

```text
required
nullable
sometimes
string
integer
numeric
boolean
array
exists
unique
enum
date
date_format
in
```

Determine:

- Are validation rules consistent?
- Are invalid enum values rejected?
- Are IDs validated appropriately?
- Are nullable fields handled consistently?
- Are API validation responses consistent?

Where PHP backed enums already exist, determine whether Laravel enum validation should be used where appropriate.

Do NOT duplicate enum definitions.

PHP enums remain the application source of truth.

Do NOT reintroduce DB enums as the application source of truth.

---

# 9. ENUM/API CONTRACT AUDIT

Phase 5.5 established:

```text
PHP Backed Enum
      ↓
Laravel Model Cast
      ↓
Database string storage
```

The PHP enum is the application source of truth.

Verify that API endpoints do not expose inconsistent status values.

For every API-visible enum:

```text
PHP enum values
↓
Model casting
↓
Validation
↓
Business logic
↓
API response
```

Check for:

```php
$status === 'active'
```

and other raw domain-state comparisons where an enum should be used.

Do not blindly replace legitimate external/API strings.

Only change genuine domain-state handling.

---

# 10. RESOURCE / SERIALIZATION AUDIT

Inspect:

```text
app/Http/Resources/
Model::toArray()
Controller responses
```

Determine whether sensitive/internal model fields are accidentally exposed.

Pay particular attention to:

```text
password
remember_token
payment fields
card information
raw_payload
client_secret
internal IDs
internal flags
timestamps
ownership fields
```

Verify Phase 2 guarantees remain intact.

If Laravel API Resources already exist, use the established pattern.

Do NOT create Resources for every model just for theoretical consistency.

---

# 11. PAGINATION CONTRACT

Phase 6 fixed pagination behavior.

Verify all list endpoints.

Look for:

```text
?page=
?per_page=
```

or the actual established convention.

Verify:

```text
current_page
per_page
total
last_page
from
to
data
```

where appropriate.

Specifically verify the Phase 6 fix:

```text
AgencyAssignmentController::myAssignments()
```

Do NOT break backward compatibility.

Check other paginated endpoints for inconsistent contracts.

Do not force pagination onto endpoints where it is not appropriate.

---

# 12. FILTER / SORT / SEARCH CONTRACT

Audit endpoints supporting:

```text
search
filter
sort
page
per_page
```

Verify:

- accepted parameter names
- defaults
- invalid values
- maximum limits
- deterministic behavior
- SQL injection safety
- authorization scope

Do not accept arbitrary database column names for sorting without allowlisting.

---

# 13. OWNERSHIP / AUTHORIZATION CONTRACT

Phase 1 and Phase 4 established important authorization behavior.

Verify that API endpoints consistently enforce:

```text
authentication
authorization
ownership
policy
role/permission
```

Pay special attention to:

```text
TripPolicy
fork authorization
AIController
MapController
blocked users
admin endpoints
agency endpoints
payment endpoints
order endpoints
subscription endpoints
```

For resource endpoints:

```text
authenticate
↓
authorize
↓
validate/action
↓
external call / quota / payment
```

Do not accidentally move authorization after an expensive or sensitive operation.

---

# 14. API RESPONSE OWNERSHIP / IDOR REVIEW

Perform a focused API-level IDOR review.

For every endpoint accepting:

```text
{id}
{trip}
{user}
{order}
{payment}
{subcription}
{destination}
```

verify that a user cannot access another user's resource merely by changing the identifier.

Do not reopen SEC-02 unnecessarily.

Only report or modify it if Phase 7 discovers a separate API contract path that bypasses the existing policy protection.

---

# 15. RATE-LIMIT CONTRACT

Verify existing throttles.

Especially:

```text
maps
checkout
authentication
other sensitive endpoints
```

Check:

```text
429 status
response structure
Retry-After if already supported
correct limiter assignment
```

Do not weaken existing limits.

Do not introduce arbitrary new limits unless an actual API-contract or abuse issue requires it.

---

# 16. API ROUTE NAMING

Audit naming consistency.

Examples:

```text
/api/v1/users
/api/v1/users/{user}
/api/v1/trips
/api/v1/trips/{trip}
/api/v1/trips/{trip}/...
```

Identify:

- inconsistent pluralization
- inconsistent nesting
- action routes
- duplicate routes
- route names
- unnecessary aliases
- unreachable routes

Do not rename public routes casually.

If changing a route would break existing clients:

> Document it instead of implementing it unless the project explicitly allows breaking changes.

---

# 17. CONTROLLER CONTRACT AUDIT

Inspect every API controller for:

- inconsistent return types
- mixed JSON/redirect responses
- missing status codes
- duplicated response formatting
- direct model exposure
- accidental HTML responses
- exception leakage
- inconsistent pagination
- missing authorization
- validation bypasses

Do NOT refactor controllers simply for style.

Only fix actual contract defects.

---

# 18. EXTERNAL API CONTRACTS

Inspect:

```text
Paymob
Groq
Nominatim
Overpass
Weather
Maps
```

Verify that external API failures are translated into stable application responses.

Do not expose:

```text
vendor exceptions
API keys
raw vendor payloads
internal timeout details
```

Preserve Phase 1 timeout protections and Phase 2 payment protections.

---

# 19. API IDEMPOTENCY CONTRACT

Verify Phase 2 checkout behavior.

For endpoints where idempotency exists:

```text
same idempotency key
same user
same operation
```

must not accidentally create duplicate operations.

Verify API response behavior for repeated requests.

Do not modify the established payment semantics unless a real contract defect is found.

---

# 20. API TEST MATRIX

Before implementation, build:

| Endpoint | Auth | Authorization | Valid Request | Invalid Request | Not Found | Forbidden | Validation | Response Contract |
|---|---|---|---|---|---|---|---|---|

Every API contract finding must have evidence.

Classify findings:

```text
REAL DEFECT
FALSE POSITIVE
INCONSISTENCY
DOCUMENTATION GAP
ACCEPTABLE DESIGN
OUT OF SCOPE
```

Do not implement false positives.

---

# 21. IMPLEMENTATION RULE

After the audit classify every proposed change:

### SAFE TO IMPLEMENT NOW

Actual API contract defect with clear expected behavior.

### RECOMMEND BUT DO NOT IMPLEMENT

Architectural improvement or potentially breaking API change.

### DO NOT CHANGE

Existing behavior is valid or required for compatibility.

Only implement:

```text
SAFE TO IMPLEMENT NOW
```

---

# 22. TEST REQUIREMENTS

Before changes:

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

After implementation:

```bash
php artisan test
```

Required:

```text
0 failures
0 regressions
```

Add focused tests only for actual changes.

Tests should cover, where applicable:

```text
correct HTTP status
response structure
validation errors
authorization errors
404 behavior
pagination
enum validation
resource serialization
rate limiting
idempotency
API versioning
```

Do not create duplicate tests for behavior already adequately covered.

---

# 23. REGRESSION REQUIREMENTS

Explicitly verify previous phases after implementation.

### Phase 1

```text
SEC-01 blocked users
SEC-02 trip IDOR
SEC-03 map throttling
SEC-12 GET purity
S-EXT-3 Nominatim timeout
```

### Phase 2

```text
SEC-05 sensitive payment data
SEC-08 checkout abuse
SEC-09 pending order lifecycle
```

### Phase 3

Verify production-hardening behavior already implemented.

### Phase 4

```text
SEC-04 public/private trip fork
SEC-10 subscription expiry
SEC-11 AI quota cache behavior
```

### Phase 5

```text
DB-02 active subscription uniqueness
DB-03 documented PostgreSQL limitation
```

### Phase 5.5

```text
PHP enum source of truth
string-based DB storage
migration organization
dead enum cleanup
```

### Phase 6

```text
PERF-01 analytics aggregation/cache
PERF-02 agency pagination
```

Do not regress any of them.

---

# 24. DO NOT START PHASE 8

This session must stop after Phase 7.

Do not perform:

```text
full final architecture certification
deployment certification
production smoke testing
complete final checklist
```

Those belong to Phase 8.

---

# 25. REQUIRED FINAL REPORT

Create/update the Phase 7 report.

Include:

## A. Baseline

```text
Tests:
Assertions:
Failures:
Duration:
```

## B. API Surface

Total API endpoints:

```text
...
```

Grouped by:

```text
Authentication
Users
Trips
Maps
AI
Commerce
Payments
Orders
Subscriptions
Admin
Agency
Other
```

Use the actual repository categories.

## C. Findings

| ID | Finding | Severity | Evidence | Status |
|---|---|---|---|---|

## D. Contract Inconsistencies

Document every real inconsistency found.

## E. Changes Implemented

List:

```text
file
change
reason
```

## F. Changes NOT Made

For every recommendation intentionally rejected:

```text
Recommendation
Reason
Risk
Future phase
```

## G. Tests

```text
Before:
After:
Assertions:
Failures:
Regressions:
New tests:
```

## H. Previous Phase Regression

Explicitly report:

```text
Phase 1: PASS
Phase 2: PASS
Phase 3: PASS
Phase 4: PASS
Phase 5: PASS
Phase 5.5: PASS
Phase 6: PASS
```

## I. Remaining API Issues

Clearly separate:

```text
BLOCKER
HIGH
MEDIUM
LOW
INFORMATIONAL
```

## J. Phase 8 Readiness

Only declare:

```text
READY FOR PHASE 8
```

if:

1. All Phase 7 actionable findings are resolved.
2. No regression exists.
3. Full test suite passes.
4. No Phase 7 blocker remains.
5. Existing Phase 1–6 protections remain intact.

Otherwise report exactly what remains.

---

# FINAL HARD RULES

1. Audit before modifying.
2. Do not assume the original findings are still present.
3. Do not manufacture API problems.
4. Do not change public API behavior without evidence.
5. Preserve backward compatibility wherever possible.
6. PHP backed enums remain the application source of truth.
7. Database string storage remains the chosen enum representation.
8. Do not reintroduce database ENUMs as application-level source of truth.
9. Do not undo Phase 1–6 security, payment, business, database, architecture, or performance fixes.
10. Do not add unnecessary architecture.
11. Do not start Phase 8.
12. Every implementation must have regression tests or be covered by existing tests.
13. Final result must include evidence, not assumptions.
14. Stop when Phase 7 is complete.

Start with READ-ONLY AUDIT.
Do not write code until the API contract inventory and findings classification are complete.