# OpenCode — Phase 4 Implementation
## Business Logic & Workflow Integrity

---

# 0. MISSION

Implement **PHASE 4 — BUSINESS LOGIC** from the approved backend remediation roadmap.

Phases 1, 2, and 3 have already been implemented and tested.

Current verified baseline:

```text
Phase 1
Security Blockers
✅ COMPLETE

Phase 2
Payment & Sensitive Data
✅ COMPLETE

Phase 3
Production Hardening
✅ COMPLETE

Current test baseline:
223 tests passed
721 assertions
0 failures
0 regressions
```

Your task is now to implement **Phase 4 only**:

```text
SEC-04
SEC-10
SEC-11
```

These findings concern **business-logic integrity**, not general refactoring.

The goal is to prevent validly authenticated users from performing actions that are technically authorized at the endpoint level but invalid according to the application's business state.

---

# 1. READ THE AUTHORITATIVE DOCUMENTATION FIRST

Before changing any code, read completely:

```text
docs/audits/findings-validation-report.md
docs/audits/remediation-roadmap.md
docs/audits/business-decision-register.md
docs/audits/security-regression-test-plan.md
```

Then inspect the current implementation after:

```text
Phase 1
Phase 2
Phase 3
```

Especially inspect any code changed by previous phases.

Priority:

```text
CURRENT CODE
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

Do not rely on memory of earlier versions of the codebase.

The current repository is the source of truth.

---

# 2. HARD SCOPE BOUNDARY

This session may modify only what is required for:

```text
SEC-04
SEC-10
SEC-11
```

Allowed supporting changes:

- business-rule guards;
- state-transition validation;
- service/domain logic directly required by these findings;
- policy checks directly required by these findings;
- transaction/locking changes required to make those business rules atomic;
- targeted validation;
- business-logic regression tests.

Do NOT implement:

```text
SEC-01
SEC-02
SEC-03
SEC-05
SEC-06
SEC-07
SEC-08
SEC-09
SEC-12
SEC-EXT-3

DB-02
DB-03

PERF-01
PERF-02

API-01

PROD-01
```

If you discover another problem:

> Document it and leave it untouched unless it is required to correctly implement SEC-04, SEC-10, or SEC-11.

---

# 3. BASELINE

Before making any changes:

```bash
git status
git branch --show-current
git log -5 --oneline
php artisan test
php artisan route:list
php artisan migrate:status
```

Expected current baseline:

```text
223 tests passed
721 assertions
0 failures
```

The exact count may differ if the repository changed.

Do not modify code until the baseline is understood.

If the baseline fails:

> STOP.

Determine whether the failure is pre-existing or related to the current session.

Do not delete, skip, or weaken existing tests.

---

# 4. BUSINESS LOGIC FIRST — DO NOT CODE IMMEDIATELY

Before changing anything, build a **business-state inventory**.

Inspect all models/services/controllers/jobs/listeners related to:

```text
PickupRequest
BinRequest
Trip
Order
Factory
Driver
Payment
Subscription
Trip Fork
```

Only include entities actually present in the repository.

For each workflow identify:

```text
Current state
Allowed next states
Forbidden transitions
Actor allowed to perform transition
Required ownership
Required assignment
Required prerequisites
Side effects
```

Produce a transition matrix before implementation.

---

# 5. STATE-MACHINE PRINCIPLE

A business action is valid only if:

```text
AUTHENTICATION
    +
AUTHORIZATION
    +
CURRENT STATE
    +
PREREQUISITES
    +
BUSINESS RULES
```

A valid JWT does NOT automatically mean an action is valid.

A valid permission does NOT automatically mean an action is valid.

Example:

```text
User authenticated
        ↓
User has permission
        ↓
BUT request is already Delivered
        ↓
Action must still be rejected
```

Do not confuse:

```text
"Can this actor call the endpoint?"
```

with:

```text
"Is this action valid for the resource's current business state?"
```

---

# 6. SEC-04 — BUSINESS WORKFLOW ENFORCEMENT

Read the exact SEC-04 definition from:

```text
docs/audits/findings-validation-report.md
docs/audits/remediation-roadmap.md
```

Do not infer missing requirements.

Then trace every affected workflow from:

```text
Route
 ↓
Controller
 ↓
Policy/Permission
 ↓
Service
 ↓
Model
 ↓
Database
 ↓
Side effects
```

Identify where the business rule is currently missing.

---

# 7. DO NOT TRUST CONTROLLER-ONLY GUARDS

If the business rule is important enough to be security/business integrity logic, determine whether it can be bypassed through:

```text
another controller
another route
job
listener
command
service
internal method call
```

Do not assume:

```php
if ($status === ...)
```

in one controller is sufficient.

Prefer placing the invariant at the narrowest shared business-operation boundary that actually owns the rule.

Do not create a new architecture layer merely for this.

Follow the existing project architecture.

---

# 8. PICKUP REQUEST WORKFLOW

The validated workflow is:

```text
Pending
   ↓
Accepted
   ↓
Assigned
   ↓
OnTheWay
   ↓
PickedUp
   ↓
Delivered
   ↓
Completed
```

Cancellation may branch where explicitly permitted:

```text
↘ Canceled
```

Do not assume every state can transition to every other state.

Build the exact transition matrix from the repository and audit documents.

---

# 9. PICKUP REQUEST TRANSITION RULES

For every transition identify:

```text
Current status
Required action
Actor
Prerequisites
New status
Side effects
```

Example structure:

```text
Pending → Accepted
    Who?
    Preconditions?
    What changes?

Accepted → Assigned
    Who?
    Factory/driver requirement?

Assigned → OnTheWay
    Who?
    Assignment requirement?

OnTheWay → PickedUp
    Who?
    Driver requirement?

PickedUp → Delivered
    Who?
    Proof/prerequisite?

Delivered → Completed
    Who?
    Required completion conditions?
```

Do not invent business requirements that are not supported by the repository/audit.

---

# 10. PREVENT INVALID SKIPPING

Verify that an action cannot skip required states.

For example, if the workflow requires:

```text
Accepted → Assigned
```

then this must not be possible:

```text
Accepted → OnTheWay
```

or:

```text
Accepted → Completed
```

unless explicitly allowed by the documented business rules.

Test both:

```text
valid transition
invalid transition
```

---

# 11. ASSIGNMENT GUARDS

The previous audit specifically identified assignment-related gaps.

Re-audit:

```text
assignFactory()
assignDriver()
```

and all equivalent methods currently present.

Verify that assignment is only possible from the correct state.

Do not rely on an error such as:

```text
driver already assigned
```

as a substitute for a proper state guard.

The system should first answer:

```text
Is assignment valid in the current state?
```

Then:

```text
Is the requested factory/driver valid?
```

---

# 12. DUPLICATE ACTIONS

Test repeated calls to state-changing operations.

Examples:

```text
assignFactory()
assignDriver()
accept()
cancel()
pickup()
deliver()
complete()
```

where applicable.

The second invocation must either:

```text
be safely idempotent
```

or:

```text
be explicitly rejected because the current state does not allow it
```

Do not allow repeated actions to create inconsistent side effects.

---

# 13. CANCELLATION RULES

Inspect all cancellation paths.

Determine exactly:

```text
Which states can be canceled?
Which actors can cancel?
What happens after cancellation?
Can a canceled request be accepted?
Can a canceled request be assigned?
Can a canceled request be completed?
```

Do not assume cancellation is universally allowed.

A terminal state should not silently return to an active state.

---

# 14. TERMINAL STATES

Identify all terminal states.

For example:

```text
Completed
Canceled
```

if those are terminal according to the current workflow.

Verify that terminal resources cannot be moved back into active states.

Test:

```text
terminal → valid?
terminal → invalid?
```

---

# 15. BIN REQUEST WORKFLOW

The validated workflow includes:

```text
Pending
   ↓
Dispatched
   ↓
Delivered
```

with:

```text
↘ Canceled
```

Reconstruct the exact workflow from the repository.

Verify:

```text
Pending → Dispatched
Dispatched → Delivered
```

and reject unsupported transitions.

---

# 16. CROSS-ENTITY BUSINESS RULES

Inspect rules involving multiple entities.

Examples may include:

```text
PickupRequest ↔ Factory
PickupRequest ↔ Driver
BinRequest ↔ Factory
Trip ↔ User
Order ↔ Payment
Trip Fork ↔ Payment
```

Only implement rules directly covered by SEC-04/SEC-10/SEC-11.

Do not turn Phase 4 into a full business-domain rewrite.

---

# 17. SEC-10 — BUSINESS AUTHORIZATION / OWNERSHIP

Read the exact SEC-10 definition from the audit documents.

Trace every affected endpoint.

Determine whether the current implementation verifies:

```text
authenticated actor
+
required permission/role
+
resource ownership/scope
+
current business state
```

Do not assume Spatie permissions alone solve resource-specific authorization.

For resource-specific operations, inspect:

```text
Policies
authorize()
Gate checks
service-level ownership checks
```

Use the mechanism already established by the codebase.

---

# 18. OWNERSHIP VS PERMISSION

Do not replace:

```text
permission
```

with:

```text
ownership
```

They answer different questions.

Example:

```text
Permission:
Can this actor perform this kind of action?

Ownership:
Does this particular resource belong to this actor?
```

Business logic may require both.

---

# 19. PREVENT AUTHORIZED BUT INVALID ACTIONS

A user can legitimately have a permission but still be prohibited by the resource state.

Verify cases such as:

```text
permission = write
resource = Completed
action = modify
```

Expected:

```text
REJECT
```

if the business rules prohibit modification after completion.

Do not use permissions as a replacement for workflow validation.

---

# 20. SEC-11 — ATOMIC BUSINESS OPERATIONS

Read the exact SEC-11 definition.

Identify operations where multiple changes must succeed together.

Examples may include:

```text
status update
assignment
payment state change
order fulfillment
entitlement granting
```

Only implement those explicitly belonging to SEC-11.

---

# 21. TRANSACTION BOUNDARIES

If an operation changes multiple pieces of state:

```text
A
+
B
+
C
```

determine whether they must be atomic:

```text
BEGIN TRANSACTION
    A
    B
    C
COMMIT
```

If any required step fails:

```text
ROLLBACK
```

Do not add transactions everywhere.

Add them where the business invariant requires atomicity.

---

# 22. CONCURRENCY

For state transitions that can be triggered concurrently, inspect:

```text
request A
      ↘
       same resource
      ↗
request B
```

Determine whether two requests could both observe:

```text
status = Pending
```

and both perform the same transition.

Where required by SEC-11, use the existing project's transaction/locking mechanisms.

Do not introduce unnecessary database locking.

---

# 23. STATE CHECK + WRITE MUST BE SAFE

Avoid patterns where:

```text
SELECT status
    ↓
application checks status
    ↓
another request changes status
    ↓
application writes stale transition
```

For business-critical transitions, ensure the check and mutation are protected appropriately.

Use:

```text
transaction
+
appropriate lock / conditional update
```

only where required.

---

# 24. SIDE EFFECTS

Inspect every affected state transition for side effects:

```text
notifications
events
jobs
payments
quota changes
assignments
timestamps
audit records
```

A failed business transition must not accidentally execute side effects.

For example:

```text
invalid transition
    ↓
must not send notification
must not dispatch fulfillment
must not charge payment
must not alter unrelated state
```

---

# 25. EVENT/LISTENER SAFETY

If the current architecture uses:

```text
Events
Listeners
Jobs
Observers
```

inspect whether an invalid state transition can trigger them.

Do not remove existing events.

Ensure events are emitted only after the underlying state change is valid.

If the event must only occur after successful transaction completion, preserve the application's existing transaction/event pattern.

---

# 26. DO NOT CREATE A STATE MACHINE FRAMEWORK UNNECESSARILY

Do not introduce:

```text
new state-machine package
new workflow engine
new domain framework
```

unless the repository already uses one or the audit explicitly requires it.

Prefer the smallest change that enforces the required invariants.

For example, if the existing service already owns:

```text
assignDriver()
```

then strengthen that operation rather than building an entirely new workflow subsystem.

---

# 27. ERROR SEMANTICS

Invalid business transitions must produce the application's established error behavior.

Inspect existing conventions for:

```text
403
409
422
404
```

Do not invent a new response format.

Use the status code that matches the existing architecture and documented contract.

Do not perform Phase 7 API-contract standardization.

---

# 28. IDEMPOTENCY VS INVALID TRANSITION

Distinguish:

```text
same valid request repeated
```

from:

```text
invalid state transition
```

Example:

```text
assignDriver()
first call:
    successful

second identical call:
    either safely idempotent
    OR explicitly rejected
```

But:

```text
Completed → assignDriver()
```

is a business-state violation.

Do not accidentally treat invalid transitions as successful idempotency.

---

# 29. TEST MATRIX

Create a complete Phase 4 business-rule matrix.

At minimum cover:

```text
B1
Valid PickupRequest transition succeeds.

B2
Invalid PickupRequest transition fails.

B3
State skipping is rejected.

B4
Duplicate assignment is handled correctly.

B5
Assignment from invalid state is rejected.

B6
Terminal PickupRequest cannot be reopened.

B7
Cancellation rules are enforced.

B8
Valid BinRequest transition succeeds.

B9
Invalid BinRequest transition fails.

B10
Terminal BinRequest cannot transition back.

B11
Ownership/resource scope is enforced where required.

B12
Permission without valid resource state is rejected.

B13
Business-critical multi-step operation is atomic.

B14
Concurrent transition cannot corrupt state.

B15
Invalid transition produces no unintended side effects.
```

Use the actual SEC-04/SEC-10/SEC-11 regression IDs from:

```text
docs/audits/security-regression-test-plan.md
```

if different.

Do not duplicate tests unnecessarily.

---

# 30. TEST REAL BUSINESS FLOWS

Do not test only methods in isolation.

For critical rules, test:

```text
HTTP request
 ↓
authentication
 ↓
authorization
 ↓
controller
 ↓
service
 ↓
database
```

where practical.

Also keep focused unit/service tests where they provide value.

The goal is to prove the actual exploit/business-violation path is closed.

---

# 31. DATABASE STATE ASSERTIONS

For rejected operations, assert that the database remains unchanged where appropriate.

Example:

```text
Before:
status = Accepted
driver_id = null

Invalid assign:
request rejected

After:
status = Accepted
driver_id = null
```

Do not only assert:

```text
HTTP 422
```

The important question is:

> Did the invalid operation actually change anything?

---

# 32. SIDE-EFFECT ASSERTIONS

For rejected business actions assert that:

```text
no unexpected event
no unexpected job
no unexpected notification
no unexpected payment
no unexpected assignment
```

was produced.

Use the repository's existing testing tools:

```text
Event::fake()
Queue::fake()
Notification::fake()
```

where appropriate.

Do not fake the operation so heavily that the actual business logic is no longer tested.

---

# 33. CONCURRENCY TESTING

Where SEC-11 requires concurrency protection, create a realistic test for the affected operation.

The test must prove:

```text
two competing operations
        ↓
only one valid transition
        ↓
consistent final state
```

Do not create a flaky timing-based test.

Use database transactions/locks or deterministic test setup where possible.

---

# 34. SEARCH FOR ALL CALL SITES

For every modified business method:

```text
assignFactory()
assignDriver()
transition()
accept()
cancel()
deliver()
complete()
```

or equivalent methods:

Search every call site.

Verify that the new guard does not unintentionally break a legitimate internal caller.

Do not fix callers by bypassing the new business rule.

If a caller is invalid, fix the caller only if it is directly required for Phase 4.

---

# 35. POLICY + SERVICE CONSISTENCY

If authorization exists in both:

```text
Policy
Service
Controller
```

avoid contradictory rules.

For example:

```text
Policy says allowed
Service says forbidden
```

or:

```text
Policy says forbidden
Service assumes allowed
```

The effective behavior must be consistent.

Do not duplicate complicated authorization logic across every layer.

---

# 36. MIGRATIONS

Do not create migrations unless SEC-04/SEC-10/SEC-11 genuinely requires a schema change.

Phase 5 is responsible for:

```text
DB-02
DB-03
```

Do not perform database-integrity remediation in Phase 4.

If you identify a database constraint that would be useful but belongs to Phase 5:

> Document it and leave it for Phase 5.

---

# 37. NO PERFORMANCE WORK

Do not optimize queries merely because you encounter them.

Phase 6 owns:

```text
PERF-01
PERF-02
```

Only make a query change if it is directly necessary to enforce Phase 4 correctness or concurrency.

Correctness takes priority over premature optimization.

---

# 38. RUN TARGETED TESTS FIRST

After implementation:

Run the Phase 4 tests.

Then:

```text
SEC-04 tests
SEC-10 tests
SEC-11 tests
```

using the exact test filters/names available in the repository.

Fix failures before running the full suite.

---

# 39. RUN PREVIOUS SECURITY REGRESSION TESTS

Verify that these remain green:

```text
Phase 1:
SEC-01
SEC-02
SEC-03
SEC-12

Phase 2:
SEC-05
SEC-08
SEC-09

Phase 3:
SEC-06
SEC-07
PROD-01
```

Do not assume previous phases remain correct after modifying shared services/models.

---

# 40. FULL TEST SUITE

Run:

```bash
php artisan test
```

Expected:

```text
0 failures
0 regressions
```

The test count should increase if new Phase 4 tests were added.

Do not require an exact number.

---

# 41. RE-AUDIT SEC-04

After implementation, answer:

```text
What business action was previously possible?
Why was it invalid?
Where was the missing invariant?
Where is it now enforced?
Can another code path bypass it?
Which tests prove it?
```

Do not merely state "fixed."

---

# 42. RE-AUDIT SEC-10

Verify:

```text
authentication
authorization
ownership/scope
business state
```

for every affected operation.

Prove that:

```text
authenticated
≠
authorized
≠
business-valid
```

where applicable.

---

# 43. RE-AUDIT SEC-11

Verify:

```text
transaction boundary
state check
mutation
side effects
concurrency
rollback behavior
```

The final state must always satisfy the business invariant.

---

# 44. BYPASS SEARCH

After implementation, search for alternate ways to perform the same business operation.

Inspect:

```text
routes
controllers
services
jobs
commands
listeners
observers
policies
```

For each affected operation ask:

```text
Can the state transition be triggered anywhere else?
```

If yes:

```text
Does the same invariant apply there?
```

Do not leave an obvious alternate path that bypasses the Phase 4 guard.

---

# 45. FILE CHANGE CONTROL

Run:

```bash
git status
git diff --stat
git diff
```

Review every changed file.

For every changed file explain:

```text
Why was this file changed?
Which Phase 4 finding requires it?
What business rule does it enforce?
```

Do not leave unrelated modifications.

Do not overwrite existing user work.

---

# 46. FINAL PHASE 4 REPORT

Return:

## Phase 4 Status

```text
IMPLEMENTED
```

## Findings

| Finding | Status | Implementation | Tests |
|---|---|---|---|
| SEC-04 | ✅ IMPLEMENTED | `trips.is_public` flag (D1 Option B); fork guard in `CheckoutService::processCheckout` via `Gate::forUser` + `TripPolicy::fork`; defense-in-depth in `TripForkService::fulfillFork` | R6 (5 tests), R7 (3 tests) |
| SEC-10 | ✅ IMPLEMENTED | `subscriptions:expire-stale` command + schedule; `renews_at` = expiry; expired subs blocked in `AiUsageService::consumeQuota` | R14 (4 tests) |
| SEC-11 | ✅ IMPLEMENTED | `GroqService::review` — `consumeQuota` moved inside `Cache::remember` closure; `AIController::review` updated to pass user | R15 (3 tests) |

## Business Transition Matrix

Subscription lifecycle (D2 — fixed-term quota pack):
```text
Active → (renews_at passes + scheduler runs) → Expired
Active → (user cancels) → Cancelled
Expired → (re-purchase) → Active (fresh term)
Active → (payment succeeds) → Active (fulfilled order)
```

Trip fork authorization (D1 — Option B — public trips forkable):
```text
Private trip  + non-owner → 403 Forbidden
Private trip  + owner     → Fork allowed
Public trip   + any user  → Fork allowed (payment required)
```

AI quota consumption (SEC-11):
```text
Cache miss → consumeQuota (inside closure) → Groq call → cache store
Cache hit  → no consumeQuota → return cached result
```

## SEC-04

```text
Previous vulnerability: TripForkStrategy::resolveProduct accepted any trip_id;
  TripForkService::fulfillFork copied full trip (incl. private content) without
  ownership or visibility check. Any authenticated user could fork any trip.

Business invariant (D1 — Option B): Fork allowed iff trip.is_public = true OR
  buyer is the owner. Private trips stay owner-only; public trips are forkable
  by any authenticated user (who pays the fork price).

Implementation:
  - Migration: trips.is_public (boolean, default false) — all existing trips
    remain private (safe default).
  - TripPolicy::fork() — returns is_public || user_id === owner.
  - CheckoutService::processCheckout — Gate::forUser($user)->denies('fork')
    throws AuthorizationException BEFORE order/payment/gateway call.
  - CheckoutController — catches AuthorizationException → 403 (not 422).
  - TripForkService::fulfillFork — defense-in-depth: re-checks is_public ||
    owner_id === buyer at fulfillment time (covers async queue, direct calls).

Bypass analysis:
  - Checkout path blocked: CheckoutController → CheckoutService → Gate check.
  - Fulfillment path blocked: FulfillOrderListener::fulfillTripFork →
    TripForkService::fulfillFork → explicit ownership/visibility guard.
  - TripController::fork (if exists) redirects to checkout endpoint.
  - Direct service call: TripForkService::fulfillFork throws AuthorizationException.
  - No way to bypass both checks.

Tests: R6 (5 tests), R7 (3 tests) in ForkAuthorizationTest.php
```

## SEC-10

```text
Authorization: Any authenticated user with active subscription.
Ownership/scope: user_id on subscriptions table.
Business-state enforcement: AiUsageService::consumeQuota checks
  Subscription::where('user_id', ...)->where('status', 'active').
  Scheduler job (subscriptions:expire-stale) flips active → expired when
  renews_at < now. Expired subs no longer satisfy the active check.

Implementation:
  - ExpireStaleSubscriptions command: updates active subs with renews_at < now
    to status = expired.
  - Scheduled every minute in routes/console.php.
  - DB migration: subscriptions.status enum expanded to include 'expired' (was
    only active/cancelled/past_due — expired was missing from enum constraint).

Tests: R14 (4 tests) in SubscriptionExpiryTest.php — covers no-expire-when-
  future, expire-when-past, quota-blocked-after-expiry, re-purchase-creates-
  fresh-sub.
```

## SEC-11

```text
Transaction boundaries: Cache::remember closure in GroqService::review now
  contains the consumeQuota call. No DB transaction needed — quota is a single
  atomic DB update guarded by a <= comparison.

Concurrency handling: AiUsageService::consumeQuota uses an atomic UPDATE with
  WHERE ai_generations_count < limit, so concurrent requests race safely — only
  one wins when limit is hit.

Rollback behavior: Quota is only consumed on cache miss (actual generation).
  If the Groq call inside the closure throws, restoreQuota is called within the
  same closure before re-throwing. Cache hit path never touches quota.

Side-effect safety: Notification not sent on cache hit (not applicable to review
  flow). No trip modification occurs in review. Quota side effect is correctly
  tied to actual generation, not cache-served responses.

Tests: R15 (3 tests) in AiQuotaCacheHitTest.php — covers miss-then-hit (quota+1),
  cache-hit-no-quota, cache-key-scoping.
```

## Files Changed

| File | Change | Reason |
|---|---|---|
| `database/migrations/2026_08_11_000002_add_is_public_to_trips_table.php` | NEW — is_public flag | SEC-04 (D1 Option B) |
| `database/migrations/2026_08_06_060001_create_subscriptions_table.php` | enum expanded | SEC-10 — 'expired' was missing from status enum |
| `app/Models/Trips/Trip.php` | is_public fillable + cast | SEC-04 |
| `app/Policies/TripPolicy.php` | added fork() method | SEC-04 |
| `app/Services/Commerce/CheckoutService.php` | Gate check before payment | SEC-04 |
| `app/Http/Controllers/Commerce/CheckoutController.php` | 403 on AuthorizationException | SEC-04 |
| `app/Services/Trips/TripForkService.php` | ownership guard at fulfillment | SEC-04 |
| `app/Console/Commands/ExpireStaleSubscriptions.php` | NEW — expiry command | SEC-10 |
| `routes/console.php` | schedule subscription expiry | SEC-10 |
| `app/Services/GroqService.php` | consumeQuota inside Cache::remember | SEC-11 |
| `app/Http/Controllers/Trips/AIController.php` | pass user to review(), remove pre-consume | SEC-11 |

## Database Changes

1. `trips.is_public` (boolean, default false) — required for SEC-04 D1 fork policy. Safe default keeps all existing trips private.
2. `subscriptions.status` enum: added `['pending', 'expired', 'paused']` — required for SEC-10. The original enum `['active','cancelled','past_due']` would throw a CHECK constraint violation when trying to set status='expired'.

## Tests

```text
Phase 4 targeted tests: 15 new (R6: 5, R7: 3, R14: 4, R15: 3)
Phase 1 regression: 0 failures
Phase 2 regression: 0 failures
Phase 3 regression: 0 failures
Full suite: 238 passed (769 assertions)
Failures: 0
Regressions: 0
```

## Definition of Done

- [x] SEC-04 re-audited — fork policy enforced at checkout + fulfillment
- [x] SEC-10 re-audited — scheduler expires subs past renews_at
- [x] SEC-11 re-audited — quota consumed only on cache miss in review path
- [x] Phase 4 tests pass
- [x] No regressions
- [x] All changed files reviewed

## Remaining Issues

Only unresolved Phase 4 issues.

Also list newly discovered issues that belong to:

```text
Phase 5
Phase 6
Phase 7
Phase 8
```

but do not fix them.

---

# 47. PHASE 4 DEFINITION OF DONE

Phase 4 is complete only when:

```text
[ ] SEC-04 implemented
[ ] SEC-10 implemented
[ ] SEC-11 implemented

[ ] Valid state transitions work
[ ] Invalid state transitions are rejected
[ ] State skipping is prevented
[ ] Duplicate actions are safely handled
[ ] Terminal states are protected
[ ] Cancellation rules are enforced
[ ] Ownership/scope is enforced where required
[ ] Permissions do not bypass business rules
[ ] Business-critical operations are atomic
[ ] Required concurrency protections exist
[ ] Invalid operations do not cause unintended side effects

[ ] Phase 4 tests pass
[ ] Phase 1 regression tests pass
[ ] Phase 2 regression tests pass
[ ] Phase 3 regression tests pass
[ ] Full suite passes
[ ] No regressions
[ ] SEC-04 re-audited
[ ] SEC-10 re-audited
[ ] SEC-11 re-audited
[ ] All changed files reviewed
```

If any required item fails:

> **PHASE 4 IS NOT COMPLETE.**

---

# 48. DO NOT OVER-ENGINEER

Do NOT introduce:

```text
new state-machine package
new workflow engine
new repository layer
new DTO layer
new domain layer
new authorization framework
new event architecture
```

unless the repository already uses it and the Phase 4 requirement explicitly depends on it.

Use the existing Laravel architecture.

Prefer:

```text
existing Service
existing Policy
existing Model
existing Transaction
existing Event/Job
```

over introducing new abstractions without need.

---

# 49. DO NOT FIX FUTURE PHASES

If you discover:

```text
database normalization issue
missing DB constraint
N+1 query
slow query
pagination issue
API response inconsistency
architecture refactor
```

do not fix it.

Record it under the appropriate future phase.

Phase 4 is about:

> **Business Logic & Workflow Integrity**

and nothing more.

---

# 50. HARD STOP

After Phase 4 implementation and re-audit:

**STOP.**

Do not implement:

```text
Phase 5 — Database Integrity
Phase 6 — Performance
Phase 7 — API Contract
Phase 8 — Final Verification
```

The roadmap must remain sequential.

---

# FINAL INSTRUCTION

Implement **ONLY Phase 4 — Business Logic**.

The objective is to ensure that:

```text
AUTHENTICATED USER
        ↓
AUTHORIZED USER
        ↓
VALID BUSINESS ACTION
        ↓
VALID CURRENT STATE
        ↓
VALID TRANSITION
        ↓
ATOMIC STATE CHANGE
        ↓
SAFE SIDE EFFECTS
```

No layer should allow an actor to bypass a business invariant simply because:

```text
the user is authenticated
or
the user has a permission
or
the endpoint is reachable
```

Preserve all protections already implemented in:

```text
Phase 1
Phase 2
Phase 3
```

Current baseline:

```text
223 tests
721 assertions
0 failures
```

Use this as the starting point.

**Do not regress previous phases.**

**Do not implement Phase 5–8.**

**Tests are mandatory.**

**Re-audit SEC-04, SEC-10, and SEC-11.**

**Stop after Phase 4.**