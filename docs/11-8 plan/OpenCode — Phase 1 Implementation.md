# OpenCode — Phase 1 Implementation
## Security Blockers Remediation

---

# 0. MISSION

Implement **PHASE 1 — SECURITY BLOCKERS** from the approved backend remediation roadmap.

This is a **code-writing session**.

The planning/audit phase is complete.

You must now implement and verify only the findings assigned to Phase 1:

```text
SEC-01 — Blocked-user enforcement
SEC-02 — Trip ownership / IDOR protection
SEC-03 — Maps destination abuse protection
SEC-12 — GET maps side-effect removal
S-EXT-3 — Nominatim timeout
```

Do NOT implement Phase 2, 3, 4, 5, 6, 7, or 8 work.

---

# 1. AUTHORITATIVE SOURCE FILES

Before touching code, read these repository documents completely:

```text
docs/audits/findings-validation-report.md
docs/audits/remediation-roadmap.md
docs/audits/business-decision-register.md
docs/audits/security-regression-test-plan.md
```

Treat them as the implementation specification.

Source priority:

```text
CURRENT CODEBASE
    ↓
CURRENT TESTS
    ↓
findings-validation-report.md
    ↓
business-decision-register.md
    ↓
remediation-roadmap.md
    ↓
security-regression-test-plan.md
```

If a source contradicts the current code, investigate before changing anything.

Do not silently invent requirements.

---

# 2. HARD SCOPE BOUNDARY

You are implementing **Phase 1 only**.

Allowed:

```text
SEC-01
SEC-02
SEC-03
SEC-12
S-EXT-3
```

Allowed supporting changes:

- security regression tests directly related to these findings;
- minimal migrations only if absolutely required by a Phase 1 fix;
- minimal configuration changes required by Phase 1;
- minimal refactoring required to safely implement the fixes.

Not allowed:

```text
SEC-05
SEC-08
SEC-09
SEC-04
SEC-10
SEC-11
DB-02
DB-03
PERF-01
PERF-02
API-01
PROD-01
```

Do not opportunistically fix unrelated problems.

If you discover another issue, document it instead of fixing it.

---

# 3. CURRENT BASELINE

Before implementation:

```bash
git status
git branch --show-current
git log -5 --oneline
php artisan test
php artisan route:list
php artisan migrate:status
```

Record the baseline.

Do not:

```text
reset
clean
checkout another branch
delete migrations
delete tests
modify unrelated work
```

If the baseline tests fail, stop and investigate whether the failure existed before Phase 1.

Do not hide baseline failures.

---

# 4. IMPLEMENTATION PRINCIPLES

Follow these rules throughout the phase:

### 4.1 Preserve the existing architecture

Use the project's existing:

- middleware;
- Policies;
- Form Requests;
- Services;
- Resources;
- Strategies;
- existing authentication implementation.

Do not introduce:

```text
CQRS
Repository pattern
DTO layer
Event sourcing
microservices
new abstraction layers
```

unless the existing architecture genuinely requires one for the Phase 1 fix.

---

### 4.2 Authorization belongs server-side

Never rely on:

```text
frontend hiding
route obscurity
IDs being difficult to guess
```

Authorization must be enforced by the backend.

---

### 4.3 Prefer centralized enforcement

If an existing Policy, middleware, or service boundary is appropriate, use it rather than duplicating authorization checks throughout controllers.

But do not refactor unrelated authorization code.

---

### 4.4 Tests are part of the implementation

Every Phase 1 security fix must have regression coverage.

Required workflow:

```text
Understand existing test
        ↓
Add failing regression test
        ↓
Implement minimal fix
        ↓
Run targeted test
        ↓
Run related test suite
        ↓
Run full suite
```

---

# 5. SEC-01 — BLOCKED USER ENFORCEMENT

## Finding

The validated audit found that:

```text
users.is_active = false
```

does not currently provide sufficient enforcement against authentication/use of the account.

The implementation must establish the intended blocked-user behavior documented in the validated findings.

---

## 5.1 Login enforcement

Trace the actual authentication flow:

```text
Login
 ↓
Credentials
 ↓
User lookup
 ↓
Password verification
 ↓
JWT creation
```

Ensure an inactive/blocked user cannot obtain a new authenticated token.

Expected behavior:

```text
active user
    → authentication succeeds

inactive user
    → authentication rejected
    → no usable JWT issued
```

Use the project's existing authentication conventions.

Do not create a second authentication mechanism.

---

## 5.2 Existing JWT enforcement

Do NOT assume blocking a user only needs a login check.

Inspect the current JWT authentication flow.

Determine where an authenticated request resolves the current user.

Ensure that an inactive user cannot continue using an already-issued JWT where the project's security model requires immediate blocking.

Implement this at the most appropriate existing centralized authentication boundary.

Avoid duplicating:

```php
if (!$user->is_active)
```

through every controller.

---

## 5.3 Token revocation

Inspect whether the current JWT package/project supports appropriate token invalidation.

If immediate revocation is already supported by the existing architecture, use it.

Do not introduce an unrelated token-management system.

If the current architecture cannot revoke existing stateless JWTs without a larger redesign, document the limitation rather than inventing one.

The minimum required guarantee is:

```text
blocked account
→ cannot obtain a new token
→ protected requests must enforce account status according to the established security rule
```

---

## 5.4 Required tests

Implement regression tests covering at minimum:

```text
R1
Blocked user cannot log in.

R2
Blocked user cannot use an existing authenticated session/token if
the current authentication architecture supports centralized status enforcement.

R3
Active user can still authenticate normally.

R4
Reactivated user can authenticate normally.
```

Use the project's existing test conventions.

Do not create a completely separate testing style.

---

# 6. SEC-02 — TRIP IDOR / BOLA

## Finding

The audit confirmed unauthorized trip access paths.

The affected areas identified by the audit include:

```text
AI trip review
Maps trip access
```

The implementation must enforce authorization based on the actual business ownership/visibility rules.

---

# 6.1 Trace every affected endpoint

Before editing:

```text
Route
 ↓
Middleware
 ↓
Controller
 ↓
Service
 ↓
Trip query
 ↓
Authorization
 ↓
External service
```

Inspect the current implementation for:

```text
AIController
MapController
TripController
TripPolicy
Trip services
Trip model
route model binding
```

Do not assume the controller is the only authorization boundary.

---

# 6.2 Ownership enforcement

For private/user-owned trips:

```text
requesting user
        ↓
must be authorized to access trip
```

A user must not be able to access another user's private trip merely by changing:

```text
trip_id
```

The authorization must occur before sensitive trip data is returned or sent to an external provider.

---

# 6.3 AI review

For AI trip review specifically:

```text
User A
 ↓
AI review request
 ↓
Trip B
```

must not result in Trip B's private information being sent to the AI provider unless the requesting user is authorized.

Authorization must happen **before** the external AI call.

Do not fix the problem by filtering the AI response after the external request.

---

# 6.4 Maps trip

For maps trip access:

```text
User A
 ↓
/maps/trip/{tripB}
```

must not expose Trip B's private itinerary/data without authorization.

Again:

> Authorization must occur before sensitive data reaches external services.

---

# 6.5 Reuse existing Policies where appropriate

If the project already contains a Trip Policy, inspect and reuse it.

Do not create duplicate authorization logic if the existing policy can express the rule correctly.

If the policy is incomplete, extend it minimally.

---

# 6.6 Required tests

Implement regression coverage for:

```text
R3
User can access own authorized trip.

R4
User cannot access another user's private trip.

R5
Unauthorized AI review is rejected.

R6
Unauthorized maps-trip access is rejected.

R7
Authorized trip access continues to work.
```

Also verify:

```text
unauthorized request
→ no AI call
→ no external map processing
→ no sensitive trip serialization
```

Where practical, mock the external provider and assert it was not called.

---

# 7. SEC-03 — MAPS DESTINATION ABUSE PROTECTION

## Finding

The audit confirmed that the maps destination endpoint can trigger expensive external operations and requires abuse protection.

The endpoint's business purpose must be preserved.

Do not simply remove the endpoint.

---

# 7.1 Preserve public/private behavior according to current validated rules

The implementation must respect the approved business decision for the maps endpoint.

Do not invent authentication requirements.

If the validated plan specifies:

```text
public endpoint
+
strict throttling
+
cache
+
pure GET
+
queued background enrichment
```

implement that model.

If the current repository documentation specifies a different exact rule, follow the repository specification.

---

# 7.2 Add appropriate throttling

The endpoint must have a meaningful rate limit appropriate for its cost.

Inspect existing Laravel rate-limit conventions first.

Prefer existing infrastructure:

```text
RateLimiter
throttle middleware
existing named limiters
```

rather than introducing a new rate-limiting package.

The limit must protect against:

```text
request flooding
external API exhaustion
worker exhaustion
```

without unnecessarily breaking legitimate use.

---

# 7.3 Do not confuse throttling with authentication

A public endpoint can still be throttled.

Do not automatically convert the endpoint into an authenticated-only endpoint unless the validated business requirements explicitly require it.

---

# 7.4 Cache expensive map results

Inspect existing cache infrastructure.

If the validated roadmap specifies caching, implement the minimum appropriate cache around expensive external map/geocoding results.

Consider:

```text
destination identifier
coordinates
external response
TTL
cache invalidation
```

Do not cache user-specific sensitive data globally.

---

# 7.5 Protect external calls

The request path must not unnecessarily perform multiple expensive external operations on every request.

Where the approved Phase 1 design requires:

```text
GET
 ↓
read cached/generated map data
```

and:

```text
background job
 ↓
geocoding/enrichment
```

implement only the minimum change required.

Do not implement the complete queue/scheduler production hardening from Phase 3.

---

# 7.6 Required tests

Implement:

```text
R8
Maps destination endpoint is protected against request flooding.

R9
Rate-limited requests receive the expected rejection response.

R10
Cached map data avoids repeated expensive external calls.

R11
Normal legitimate requests still work.

R12
The endpoint does not expose another user's private trip data.
```

Use mocks/fakes for external providers.

Do not call real third-party services from tests.

---

# 8. SEC-12 — REMOVE GET SIDE EFFECT

## Finding

The audit confirmed that the maps GET endpoint performs database mutation.

The target behavior is:

```text
GET
=
read-only
```

---

# 8.1 Identify the exact mutation

Before modifying code, document:

```text
GET endpoint:
Controller/service:
Model:
Field changed:
Reason for current write:
```

Determine whether the write represents:

```text
business state
cache state
geocoding state
metadata
last-known coordinates
```

Do not remove a write blindly.

---

# 8.2 Implement pure GET behavior

The GET endpoint must not mutate business state.

Expected:

```text
GET
 ↓
read
 ↓
return
```

If enrichment is required:

```text
GET
 ↓
read existing data
 ↓
return
```

and:

```text
background job
 ↓
enrichment
 ↓
persist
```

Do not implement unrelated scheduler infrastructure in Phase 1.

---

# 8.3 Required tests

Add a regression test proving:

```text
R13
GET maps endpoint does not modify the destination/trip record.

R14
Repeated GET requests do not create repeated DB writes.

R15
GET still returns valid map data.
```

Use database assertions where appropriate.

---

# 9. S-EXT-3 — NOMINATIM TIMEOUT

## Finding

The audit identified the Nominatim external call as lacking sufficient explicit timeout protection.

---

# 9.1 Inspect current HTTP integration

Find the exact service/client responsible for Nominatim.

Determine whether:

```text
shared HTTP timeout
service-specific timeout
retry
connect timeout
request timeout
```

already exists.

Do not add duplicate configuration if an existing shared policy already protects the request.

---

# 9.2 Phase 1 scope

Implement the **minimal Nominatim-specific protection** required by the validated roadmap.

Do not build the full global external HTTP client policy.

That belongs to:

```text
Phase 3 — Production Hardening
```

---

# 9.3 Required tests

Where the project's test infrastructure allows it, verify:

```text
R16
Nominatim request has explicit timeout protection.
```

Use mocked HTTP behavior.

Never depend on a real Nominatim request during tests.

---

# 10. TESTING REQUIREMENTS

Do not merely add happy-path tests.

Security tests must prove the attack is prevented.

For every vulnerability:

```text
Attack
 ↓
Expected rejection/protection
 ↓
No sensitive side effect
 ↓
Normal authorized behavior still works
```

---

# 11. REQUIRED PHASE 1 REGRESSION MATRIX

At completion, provide evidence for:

| Test | Requirement |
|---|---|
| R1 | Blocked user cannot login |
| R2 | Blocked existing authentication is enforced |
| R3 | Own trip access works |
| R4 | Other user's private trip blocked |
| R5 | Unauthorized AI review blocked |
| R6 | Unauthorized maps-trip access blocked |
| R7 | Authorized trip access works |
| R8 | Maps endpoint abuse protection |
| R9 | Rate-limit rejection works |
| R10 | Map cache prevents repeated external work |
| R11 | Normal map request works |
| R12 | No private trip exposure |
| R13 | GET map endpoint is read-only |
| R14 | Repeated GETs do not mutate DB |
| R15 | Valid map response preserved |
| R16 | Nominatim timeout enforced |

If the exact test IDs in the repository's current regression plan differ, preserve the repository's IDs rather than inventing duplicate IDs.

---

# 12. TEST EXECUTION ORDER

Run:

### Step 1

New/modified targeted tests.

### Step 2

Related feature tests:

```bash
php artisan test --filter=...
```

using the project's actual relevant test names.

### Step 3

Full suite:

```bash
php artisan test
```

### Step 4

If available, run static/security checks already configured by the project.

Do not add new tooling unless necessary.

---

# 13. NO TEST CHEATING

Do not:

- weaken assertions;
- remove failing tests;
- skip tests;
- mark tests incomplete;
- mock away the code under test;
- bypass authorization to make tests pass;
- change expected security behavior to match broken implementation.

A test should prove the actual security property.

---

# 14. DATABASE SAFETY

If a migration is genuinely required for Phase 1:

1. Explain why.
2. Inspect existing migration history.
3. Ensure it is backward-compatible where appropriate.
4. Test migration behavior.
5. Do not modify unrelated schema.

Do not create a migration merely because it feels cleaner.

---

# 15. API COMPATIBILITY

Preserve existing API contracts unless the security fix requires a change.

If changing:

```text
HTTP status
response envelope
error message
```

document it.

Do not perform the API-wide standardization assigned to Phase 7.

---

# 16. EXTERNAL SERVICE SAFETY

Tests must never depend on:

```text
Groq
Nominatim
Overpass
Paymob
Open-Meteo
```

or other live external services.

Use Laravel's existing:

```text
Http::fake()
mock()
stub()
```

patterns where appropriate.

---

# 17. AFTER IMPLEMENTATION — RE-AUDIT EACH FINDING

For each Phase 1 finding, produce:

```text
SEC-01
Before:
Fix:
After:
Test:
Status:

SEC-02
Before:
Fix:
After:
Test:
Status:

SEC-03
Before:
Fix:
After:
Test:
Status:

SEC-12
Before:
Fix:
After:
Test:
Status:

S-EXT-3
Before:
Fix:
After:
Test:
Status:
```

Every finding must end as:

```text
RESOLVED
```

or:

```text
PARTIALLY RESOLVED
```

with an explicit explanation.

---

# 18. SECURITY VERIFICATION

After implementation, inspect the affected paths again.

Verify:

```text
No bypass through alternate route
No bypass through direct service invocation
No authorization after external call
No duplicate authorization paths that disagree
No public endpoint without intended throttle
No GET business-state mutation
No unbounded Nominatim call
```

Check route middleware and policies, not just controller code.

---

# 19. REGRESSION REQUIREMENT

The full existing test suite must remain green.

Target:

```text
Existing tests:
PASS

New Phase 1 tests:
PASS

Full suite:
PASS

No unrelated regressions:
YES
```

If the full suite fails:

**Do not declare Phase 1 complete.**

---

# 20. DOCUMENTATION

Update only the relevant audit/remediation documentation if necessary.

Record:

```text
Implementation date
Files changed
Tests added/changed
Security findings resolved
Any deviations from roadmap
Any remaining limitations
```

Do not rewrite the entire audit report.

Do not modify future-phase scope.

---

# 21. FINAL REPORT FORMAT

At the end, provide a concise but complete implementation report:

## Phase 1 Status

```text
IMPLEMENTED / PARTIALLY IMPLEMENTED / BLOCKED
```

## Findings

| Finding | Status | Implementation | Tests |
|---|---|---|---|
| SEC-01 | | | |
| SEC-02 | | | |
| SEC-03 | | | |
| SEC-12 | | | |
| S-EXT-3 | | | |

## Files Changed

List every changed file and explain why.

## Tests

```text
Targeted tests:
Full suite:
Failures:
```

## Security Verification

Explain how each exploit path is now blocked.

## Remaining Issues

Only list issues that remain unresolved.

Do not silently fix Phase 2–8 issues.

---

# 22. PHASE 1 DEFINITION OF DONE

Phase 1 is complete only when ALL are true:

```text
[ ] SEC-01 implemented
[ ] SEC-02 implemented
[ ] SEC-03 implemented
[ ] SEC-12 implemented
[ ] S-EXT-3 implemented
[ ] Required regression tests added
[ ] Existing related tests pass
[ ] Full test suite passes
[ ] No security bypass discovered
[ ] No unrelated scope implemented
[ ] Findings re-verified
[ ] Files changed documented
```

If any item is false:

> Phase 1 is NOT complete.

---

# 23. HARD STOP AFTER PHASE 1

After completing Phase 1:

**STOP.**

Do not start:

```text
Phase 2 — Payment & Sensitive Data
Phase 3 — Production Hardening
Phase 4 — Business Logic
Phase 5 — Database Integrity
Phase 6 — Performance
Phase 7 — API Contract
Phase 8 — Final Verification
```

Even if you notice an easy fix.

Document it for its assigned phase and stop.

---

# FINAL INSTRUCTION

Implement Phase 1 based on the validated audit artifacts.

The goal is not to make the code "look more secure."

The goal is to prove that the specific validated security findings are actually closed:

```text
BLOCKED USERS
      ↓
cannot authenticate/use protected access

TRIP IDOR
      ↓
unauthorized private trip access blocked

MAP ABUSE
      ↓
expensive public endpoint protected

MAP GET SIDE EFFECT
      ↓
GET becomes read-only

NOMINATIM
      ↓
bounded external request
```

Use the smallest safe changes compatible with the existing Laravel architecture.

**Tests are mandatory.**

**Evidence is mandatory.**

**No Phase 2–8 implementation.**

**Stop after Phase 1.**