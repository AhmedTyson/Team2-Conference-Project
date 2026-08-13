# OpenCode — Backend Audit Remediation, Hardening & Verification Execution Plan

## Project

**Repository:** `Team2-Conference-Project`  
**Target branch:** `main`  
**Audit baseline commit:** `38b18c4`  
**Primary audit:** `docs/audits/2026-08-10-consolidated-backend-audit.md`

This is a **controlled backend remediation and verification execution plan**.

It is **not a new full audit**.

The purpose is to:

1. verify the existing audit findings against the current codebase;
2. safely implement the required fixes;
3. preserve existing architecture and behavior;
4. test every meaningful change;
5. verify database integrity;
6. verify security and authorization;
7. update the audit documentation;
8. produce an honest final execution report.

---

# 1. ROLE

Act simultaneously as:

- Senior Laravel Engineer
- Laravel Architect
- Backend Security Engineer
- API Engineer
- Database Engineer
- QA/Test Engineer
- Code Reviewer
- Production Reliability Engineer

Treat this as a real production-oriented Laravel backend.

Prioritize:

```text
1. Data integrity
2. Security
3. Correctness
4. Business rules
5. Backward compatibility
6. Testability
7. Maintainability
8. Performance
9. Code style
```

Do not optimize for clean-looking code at the expense of correctness.

---

# 2. SOURCE OF TRUTH

The primary source for Phases 1–8 is:

```text
docs/audits/2026-08-10-consolidated-backend-audit.md
```

The audit is the source of the **original findings**.

However:

> The audit is not unquestionable truth about the current repository.

The repository may have changed since the audit.

Before implementing every phase:

1. inspect the current implementation;
2. verify the original finding;
3. determine whether it still exists;
4. determine whether it was partially fixed;
5. determine whether it was completely fixed;
6. determine whether later changes introduced a different problem;
7. only then decide what code should change.

Never force an outdated fix onto a changed architecture.

If the original finding no longer applies, report:

```text
Phase:
Original finding:
Current state:
Evidence:
Why the original fix is no longer required:
Action:
```

Possible result:

```text
NOT APPLICABLE — ALREADY RESOLVED
```

Do not modify code simply to satisfy the wording of an old audit.

---

# 3. ABSOLUTE EXECUTION RULES

## Rule 1 — Inspect Before Editing

Never edit a file before reading:

- the target implementation;
- its callers;
- its tests;
- its related routes;
- its relevant models;
- its policies/middleware;
- relevant database schema.

---

## Rule 2 — Never Invent Architecture

Do not introduce architecture merely because it is considered "best practice."

Do not automatically create:

```text
Repositories
Services
Actions
DTOs
Interfaces
Contracts
Traits
Domains
Factories
Additional layers
```

unless the existing implementation demonstrates a real need.

Use the project's current architectural style whenever possible.

---

## Rule 3 — Files Listed in a Phase Are Expected Scope, Not Investigation Limits

A phase may say:

```text
Files touched:
X.php
Y.php
```

This means those are expected changes.

It does **not** mean you should refuse to inspect or modify another file if the current implementation requires it.

If another file genuinely needs modification:

1. explain why;
2. include it in the phase result;
3. keep the change minimal.

Never recreate an old architecture just to match an outdated file list.

---

# 4. PRESERVE EXISTING WORK

Before doing anything:

```bash
git status
git branch --show-current
git log -5 --oneline
git diff
git diff --cached
```

If uncommitted changes exist:

- inspect them;
- preserve them;
- do not reset them;
- do not stash them automatically;
- do not overwrite them;
- do not delete them.

Determine whether they already address one or more phases.

If the current work conflicts with a planned phase:

> Stop that phase and report the conflict before modifying the affected lines.

Never use destructive Git commands such as:

```bash
git reset --hard
git clean -fd
git checkout -- .
git restore .
```

unless explicitly authorized.

---

# 5. BASELINE AND REMOTE SAFETY

The plan is based on:

```text
38b18c4
```

Attempt to verify the current remote state:

```bash
git fetch origin main
git log --oneline 38b18c4..origin/main
```

If `git fetch` fails:

- do not assume nothing changed;
- do not silently continue as if the baseline were current;
- determine what local Git information is available;
- report the inability to verify the remote;
- continue only if the baseline relationship can be established reliably.

Do not invent remote state.

---

# 6. PRODUCTION / RAILWAY SAFETY

The repository may contain configuration for Railway or other deployment environments.

Inspect deployment configuration when relevant.

However:

> Inspection of production configuration does NOT constitute permission to mutate production.

Do not:

- run production migrations;
- alter production data;
- delete production records;
- rollback production migrations;
- modify production configuration;
- connect to production databases;
- execute destructive commands against Railway;

unless explicit authorization and safe access are provided for this task.

If production migration state cannot be verified, report:

```text
UNKNOWN — NOT VERIFIED
```

Do not assume it is fresh.

---

# 7. SECRETS

Never expose or reproduce:

- API keys
- passwords
- JWT secrets
- database credentials
- OAuth secrets
- payment credentials
- private tokens
- encryption keys

If discovered:

```text
[REDACTED SECRET]
```

Do not commit secrets.

---

# 8. NO DESTRUCTIVE DATABASE OPERATIONS

Never run:

```bash
php artisan migrate:fresh
php artisan migrate:refresh
php artisan db:wipe
```

against:

- production;
- staging;
- shared databases;
- teammate databases;
- any database containing important data.

These commands may only be used against a disposable test database when the environment is explicitly confirmed disposable.

---

# 9. DATABASE TRUTH RULE

Never infer database state from Git history alone.

These are different things:

```text
Git migration files
≠
Executed migrations
```

and:

```text
Current migration file
≠
Historical migration that a database previously executed
```

Use:

```bash
php artisan migrate:status
```

when access to the relevant database exists.

If a database's state cannot be verified:

```text
UNKNOWN
```

Do not assume it is fresh.

---

# 10. API CONTRACT PROTECTION

Before modifying any API route, verify:

- current URI;
- HTTP method;
- route parameters;
- middleware;
- authorization;
- request format;
- response format;
- known internal callers;
- tests;
- frontend/API documentation where available.

Do not unintentionally break:

- URI contracts;
- HTTP methods;
- response structures;
- authentication requirements;
- authorization semantics.

If a breaking change is intentional, document it explicitly.

---

# 11. PHASE EXECUTION PROTOCOL

Every phase must follow:

```text
PRE-CHECK
    ↓
INVESTIGATE
    ↓
IMPLEMENT
    ↓
TARGETED TEST
    ↓
RELATED REGRESSION TEST
    ↓
STATIC / RUNTIME VERIFICATION
    ↓
DIFF REVIEW
    ↓
PHASE REPORT
```

---

## Step A — Pre-Check

Record:

```text
Phase:
Objective:
Priority:
Original finding:
Current implementation:
Does the problem still exist?
Dependencies:
Expected files:
Risk:
```

---

## Step B — Investigate

Inspect relevant:

- routes;
- controllers;
- middleware;
- policies;
- Form Requests;
- models;
- relationships;
- services;
- actions;
- migrations;
- tests;
- configuration.

Do not inspect only the file named in the phase.

---

## Step C — Implement

Make the smallest correct change.

Avoid unrelated refactoring.

---

## Step D — Targeted Test

Run the smallest relevant test first.

Example:

```bash
php artisan test --filter=RelevantTest
```

If the project has existing lint/static/type checks, run the relevant ones.

Do not add new testing infrastructure merely to claim completion.

---

## Step E — Related Regression Test

Test the surrounding behavior that could be affected.

Examples:

- Policy change → test endpoint authorization.
- Route change → verify route list and route behavior.
- Migration change → verify schema and application behavior.
- Controller validation → test service/controller integration.
- State transition → test adjacent transitions.

---

## Step F — Static / Runtime Verification

Use appropriate existing commands such as:

```bash
php artisan route:list
php artisan migrate:status
php artisan about
php artisan config:show
```

Only use commands relevant to the phase.

---

## Step G — Diff Review

Run:

```bash
git diff
git status
```

Verify:

- only intended files changed;
- no secrets;
- no debug code;
- no accidental formatting changes;
- no unrelated refactoring;
- no migration corruption;
- no test weakening.

---

## Step H — Phase Result

Every phase must end with:

```text
STATUS:
COMPLETED
PARTIALLY COMPLETED
NOT APPLICABLE
BLOCKED
SKIPPED

Evidence:
Files changed:
Tests:
Verification:
Remaining risk:
```

---

# 12. PHASE DEPENDENCIES

The execution order is intentional:

```text
Phase 0
   ↓
Phase 1
   ↓
Phase 2
   ↓
Phase 3
   ↓
Phase 4
   ↓
Phase 5–10
   ↓
Phase 11
   ↓
Phase 12
   ↓
Phase 13–17
   ↓
Phase 18
   ↓
Phase 19
   ↓
Phase 20
```

Do not skip dependencies.

If a phase fails, determine whether dependent phases can safely continue.

Never continue simply to mark progress.

---

# GROUP 0 — BASELINE VERIFICATION

# Phase 0 — Confirm Baseline Before Touching Anything

### Priority

**P0 — GATING PHASE**

### Objective

Determine whether the repository has changed since:

```text
38b18c4
```

before executing the remediation plan.

### Commands

Attempt:

```bash
git fetch origin main
git log --oneline 38b18c4..origin/main
```

Also:

```bash
git status
git branch --show-current
git log -5 --oneline
git diff
git diff --cached
```

### If commits exist after the baseline

For every commit:

1. list the commit;
2. inspect its message;
3. determine whether it touches files involved in this plan;
4. inspect the actual diff with:

```bash
git show <commit>
```

5. determine whether the commit:
   - fixed a finding;
   - partially fixed a finding;
   - introduced a conflict;
   - introduced a new issue;
   - has no relevance.

Do not assume overlap merely because filenames match.

Read the actual diff.

### Phase 0 output

```text
Baseline commit:
Current branch:
Current local HEAD:
Current origin/main:
Remote verification:
Commits after baseline:
Relevant overlapping commits:
Uncommitted changes:
Conflicting local work:
Plan still valid:
Required adjustments:
```

Phase 0 must always run.

It cannot be marked skipped.

---

# GROUP A — CONFIRMED BUGS

# Phase 1 — Fix Trip Attach/Detach Endpoints

### Priority

**P0**

### Original finding

`routes/api.php` routes:

```text
POST   /v1/trips/{trip}/attach/{type}
DELETE /v1/trips/{trip}/detach/{id}
```

to:

```text
TripController::attach()
TripController::detach()
```

Verify whether these methods are still missing.

### Requirements

Implement the missing behavior using the existing architecture.

For `attach`:

1. authenticate;
2. resolve trip;
3. verify trip ownership;
4. preserve the project's existing ownership response behavior;
5. validate `$type`;
6. accept `item_id`;
7. validate the item;
8. use the correct existing relationship;
9. prevent unsupported types;
10. return a consistent response.

Allowed types:

```text
hotel
flight
restaurant
attraction
```

Use the existing relationships, for example:

```php
$trip->hotels()->attach($itemId);
```

Do not create new relationship architecture.

For `detach`:

- determine the item's type using the existing data model;
- detach safely;
- avoid detaching unrelated records;
- preserve ownership protection.

### Test

Verify:

- valid attach;
- invalid type;
- missing item;
- nonexistent item;
- unauthorized trip;
- duplicate attach;
- valid detach;
- unauthorized detach;
- nonexistent relation;
- malformed input.

### Completion

Verify:

```bash
php artisan route:list
```

and relevant feature tests.

---

# Phase 2 — Fix Trip Fork Route Versioning

### Priority

**P1**

Verify whether:

```text
POST /api/trips/{trip}/fork
```

still exists outside the intended `v1` group.

Expected:

```text
POST /api/v1/trips/{trip}/fork
```

If the issue remains:

- move the route into the correct existing route group;
- preserve middleware;
- avoid duplicate routes;
- verify route naming.

Run:

```bash
php artisan route:list
```

Confirm the old unintended route does not remain.

Check for internal callers that may rely on the old route.

If changing the route creates a compatibility concern, report it explicitly.

---

# Phase 3 — Document Disabled Fork Endpoint

### Priority

**P3**

Verify that:

```php
TripController::fork()
```

is intentionally disabled because actual forking occurs through checkout.

If confirmed:

- add a concise comment above the route;
- explain that it is a deprecated/deprecation shim;
- reference:

```text
/v1/checkout/initiate
```

Do not change runtime behavior.

---

# Phase 4 — Enforce Agency Assignment State Transitions

### Priority

**P1**

Inspect:

```text
app/Services/Commerce/AgencyAssignmentService.php
```

Verify the actual state machine.

The methods:

```text
adminApprove()
agencyApprove()
agencyDecline()
```

must validate their expected current state before changing it.

Use the existing:

```text
AgencyAssignmentStatus
```

implementation.

If an existing transition abstraction exists, use it rather than creating duplicate logic.

A guard may take the form:

```php
assertStatus(
    AgencyAssignment $assignment,
    AgencyAssignmentStatus $expected
)
```

Use the project's established exception conventions.

### Test

Verify:

- valid transition;
- repeated transition;
- out-of-order transition;
- invalid transition;
- unauthorized transition;
- replayed request;
- relevant concurrency behavior.

Do not weaken existing state-transition tests.

---

# Phase 5 — Harden Hotel Input Validation

### Priority

**P2**

Inspect:

```text
HotelController::store()
HotelController::update()
```

Verify whether raw:

```php
$request->all()
```

is still passed into the application.

If yes, create:

```text
app/Http/Requests/Catalog/StoreHotelRequest.php
app/Http/Requests/Catalog/UpdateHotelRequest.php
```

only if the current architecture requires them.

Rules must be derived from:

1. actual `hotels` schema;
2. actual model;
3. existing business rules;
4. current API behavior;
5. existing tests.

Expected fields include only those actually used, such as:

```text
destination_id
name
address
price_per_night
rating
stars
availability
image
```

Do not invent fields.

Use:

```php
$request->validated()
```

### Test

- valid payload;
- missing fields;
- invalid types;
- invalid IDs;
- invalid numeric values;
- invalid image/file input;
- update-specific validation.

---

# Phase 6 — Harden Survey Input Validation

### Priority

**P2**

Inspect:

```text
SurveyController::store()
SurveyController::update()
```

Replace unsafe raw input only if it remains present.

Create only the required Form Requests.

Validate:

```text
budget_level
```

against the actual:

```text
BudgetLevel
```

enum.

Prefer Laravel enum validation where appropriate rather than manually duplicating enum values.

Test:

- valid enum;
- invalid enum;
- missing fields;
- invalid types;
- update behavior.

---

# Phase 7 — Consolidate Trip Authorization

### Priority

**P3**

Inspect the current ownership check in:

```text
TripController::show()
```

The existing intended behavior is:

```text
owner      → access
non-owner  → 404
```

The `404` behavior is deliberate because it avoids revealing resource existence.

If introducing:

```text
app/Policies/Trips/TripPolicy.php
```

preserve the externally visible `404`.

First determine how the installed Laravel version discovers policies.

Do not add redundant registration.

If Laravel's normal authorization path would produce `403`, adapt the implementation using the project's existing exception-handling conventions rather than accidentally changing the API contract.

### Test

```text
owner → 200
non-owner → 404
unauthenticated → 401
nonexistent trip → 404
```

---

# Phase 8 — Rate Limit AI Generation

### Priority

**P2**

Inspect:

```text
/enhance
/review
/review/{id}
```

Verify they still invoke paid/external AI services and lack adequate throttling.

If no equivalent limiter exists, implement:

```php
RateLimiter::for('ai-generation', function (Request $request) {
    return Limit::perHour(10)->by($request->user()->id);
});
```

Use the project's current Laravel rate-limiter conventions.

Apply:

```text
throttle:ai-generation
```

to the relevant endpoints.

Do not duplicate an existing limiter.

### Test

Verify:

- requests within limit;
- request over limit;
- separate users have independent limits;
- unauthenticated access;
- correct throttling response.

---

# GROUP B — GENERAL REFINEMENT

# Phase 9 — Explicit Role Mass-Assignment Protection

Inspect:

```text
app/Models/Account/Role.php
```

First inspect:

- installed Spatie Permission version;
- parent Role class;
- current model behavior;
- role seeding;
- role creation.

Do not assume generic Eloquent behavior without verifying the package implementation.

If explicit protection is appropriate:

```php
protected $fillable = [
    'name',
    'guard_name',
];
```

Do not change package behavior unnecessarily.

Run role-related tests/seeding verification.

---

# Phase 10 — Complete Agency Endpoints

Verify whether `main` still lacks:

```text
store()
adminIndex()
cancel()
```

and whether the Policy/routes remain incomplete.

Do not blindly copy an old session patch.

Reconstruct the correct implementation from the current codebase.

Verify:

### Customer

- can create agency request;
- can view appropriate request;
- can cancel only when business rules permit.

### Admin

- can view pending requests;
- can perform authorized actions.

### State machine

- invalid cancellation is rejected;
- duplicate operations are rejected;
- status guards are respected.

### Routes

Verify:

- correct API version;
- correct middleware;
- correct policy;
- correct permission names.

Run Agency-related tests.

---

# GROUP C — SOFT DELETE SAFETY

## CRITICAL DATABASE WARNING

This group concerns schema history and existing databases.

Do not modify migrations until:

1. current migration files are inspected;
2. migration status is inspected where safely possible;
3. environment states are understood;
4. the current schema is understood.

---

# Phase 11 — Repair Soft-Delete Migration Strategy

### Priority

**P0 — DATA INTEGRITY**

### Original problem

The soft-delete change reportedly modified original:

```text
create_*_table
```

migrations instead of adding new migrations.

The affected tables reported by the audit include:

```text
trips
hotels
categories
countries
destinations
restaurants
flight
attraction
ai_recommendation
surveys
reviews
```

Verify the actual current list before changing anything.

---

## Step 1 — Inventory migration states

Do not assume.

Where access is available, determine:

```text
Environment
Migration state
Schema state
Verification method
```

Potential environments:

```text
Local development
Railway/deployed environment
CI/test database
Other explicitly known environments
```

If production/Railway cannot safely be queried:

```text
UNKNOWN — NOT VERIFIED
```

Do not attempt to access or mutate production merely to fill the table.

---

## Step 2 — Inspect migration history

Determine:

- original create migration contents;
- whether soft deletes were added directly;
- whether additive migrations already exist;
- whether an earlier additive migration was deleted/replaced;
- which migrations are currently present;
- whether timestamps/order are valid.

Do not assume the audit's exact file list is still correct.

---

## Step 3 — Choose a safe migration strategy

If the original migration modification is still present, the preferred strategy is:

1. restore original create migrations to their historical schema intent;
2. add separate additive migrations;
3. each additive migration adds the required `deleted_at`;
4. ensure migration ordering is correct;
5. preserve existing migration history semantics.

However:

> Do not blindly modify historical migrations if doing so would create an unsafe or ambiguous state for databases that already executed them.

First determine the actual database states.

---

## Step 4 — Handle already-partially-migrated databases

If a database already contains:

```text
deleted_at
```

while the new additive migration has not run, the migration must not blindly attempt to add the same column again.

A defensive `up()` may use:

```php
if (! Schema::hasColumn('hotels', 'deleted_at')) {
    Schema::table('hotels', function (Blueprint $table) {
        $table->softDeletes();
    });
}
```

Adapt the table name appropriately.

### Important

Do not blindly make `down()` symmetrical with:

```php
if (Schema::hasColumn(...)) {
    dropSoftDeletes();
}
```

because this can drop a column that existed before the migration itself ran.

Rollback semantics must represent the migration's own responsibility.

If the database state is ambiguous, do not invent a rollback strategy.

Document the required manual remediation instead.

---

## Step 5 — Migration safety requirement

The final strategy must account for:

```text
Fresh database
Existing pre-change database
Database that already received the old/bad migration
Partial migration state
```

If one migration strategy cannot safely support all states, document the required state-specific remediation.

Do not hide the complexity with overly defensive migrations.

---

# Phase 12 — Verify Migration Paths

Use disposable databases for destructive testing.

Test:

### Scenario A — Existing pre-change database

Start with the schema before the soft-delete change.

Run:

```bash
php artisan migrate
```

Confirm:

- migrations succeed;
- `deleted_at` columns exist;
- schema is correct.

---

### Scenario B — Fresh database

In a disposable environment:

```bash
php artisan migrate:fresh --seed
```

Confirm:

- migrations succeed;
- seeds succeed;
- schema matches Scenario A.

---

### Scenario C — Already-partially-fixed database

In a disposable environment, simulate:

```text
old in-place migration already executed
deleted_at already exists
new additive migration has not executed
```

Then run the new migrations.

Confirm:

- no duplicate-column failure;
- final schema is correct;
- application behavior is correct.

---

### Schema comparison

Compare all three resulting states for:

```text
Tables
Columns
Indexes
Foreign keys
Soft-delete columns
Relevant constraints
```

Do not claim migration safety until Scenario C has been explicitly addressed.

---

# Phase 13 — Admin Trashed Records

First determine which models actually use:

```php
SoftDeletes
```

Do not rely solely on the audit list.

For applicable admin resources, support:

```text
?trashed=1
```

Expected:

```text
default → non-trashed
?trashed=1 → trashed
```

Only authorized admins may access trashed records.

Do not expose trashed records through normal customer endpoints.

Reported resources include:

```text
Hotel
Restaurant
Attraction
Flight
Country
Category
Destination
Trip
Review
Survey
AiRecommendation
```

Verify which are actually applicable.

---

# Phase 14 — Restore Endpoints

For applicable resources, implement:

```text
PATCH /v1/admin/{resource}/{id}/restore
```

only after verifying:

- model uses SoftDeletes;
- route conventions;
- controller conventions;
- permission conventions;
- policy requirements.

Use an implementation consistent with the project, such as:

```php
Model::onlyTrashed()
    ->findOrFail($id)
    ->restore();
```

### Authorization

Use the same appropriate permission/policy model already protecting resource management.

Do not invent permission names.

### Test

- authorized admin restores;
- unauthorized user rejected;
- active record handled correctly;
- nonexistent record handled correctly;
- restored record appears normally;
- trashed listing updates correctly.

---

# Phase 15 — Soft Delete + Unique Constraints

This is an investigation phase.

For every soft-deletable table:

1. inspect migration indexes;
2. inspect model validation;
3. inspect creation logic;
4. inspect update logic;
5. identify unique constraints;
6. determine expected business semantics.

For each unique field answer:

```text
Should a soft-deleted row continue occupying the unique value?
```

or:

```text
Should deleting the row release the unique value?
```

Do not automatically change constraints.

If a change is necessary:

- document the affected table;
- document the old behavior;
- document the new behavior;
- explain the database-specific implementation;
- add tests.

---

# Phase 16 — Soft Delete + Cascade Behavior

Audit relevant relationships.

Determine:

```text
Parent soft-deleted
↓
Child remains?
↓
Expected?
```

and:

```text
Parent force-deleted
↓
Database cascade?
↓
Application cleanup?
↓
Expected?
```

Remember:

```text
Soft delete
≠
Database DELETE
```

A database `ON DELETE CASCADE` does not automatically execute merely because Eloquent performed a soft delete.

If an actual bug is discovered:

- document it;
- determine scope;
- implement only if necessary;
- add it to the final risk register.

Do not silently expand the phase.

---

# Phase 17 — Soft Delete Feature Tests

Add or extend tests for applicable resources.

Verify:

1. `destroy()` soft-deletes;
2. normal index excludes the record;
3. `?trashed=1` exposes it only to authorized admins;
4. restore works;
5. restored record returns to normal listings;
6. unauthorized restore fails;
7. repeated operations behave correctly;
8. relationships behave correctly;
9. unrelated records are unaffected.

Avoid creating unnecessary duplicate test suites.

---

# GROUP D — FINAL VERIFICATION

# Phase 18 — Full Regression Test

Run:

```bash
php artisan test
```

Also run existing project tooling for:

- static analysis;
- formatting;
- linting;
- type checks;

when already configured.

If failures occur:

1. identify whether they are caused by these changes;
2. fix genuine regressions;
3. never weaken or delete tests just to obtain green results;
4. separate pre-existing failures from newly introduced failures.

Report both.

---

# Phase 19 — Update Audit Documentation

Update:

```text
docs/audits/2026-08-10-consolidated-backend-audit.md
```

For every finding, document:

```text
Finding:
Original state:
Current state:
Fix:
Files changed:
Tests:
Verification:
Status:
```

Mark a finding resolved only when evidence supports resolution.

Add the newly discovered soft-delete findings.

Do not rewrite historical audit conclusions without preserving what changed.

---

# Phase 20 — Final Execution Report

Produce a final report containing:

## Repository

```text
Repository:
Branch:
Starting commit:
Ending commit:
Working tree:
```

## Phase Summary

| Phase | Status | Files Changed | Tests | Verification | Remaining Risk |
|---|---|---|---|---|---|
| 0 — Baseline confirmation | COMPLETED | — | — | baseline `38b18c4` confirmed; post-baseline merges identified | backend unaffected by post-baseline merges |
| 1 — Trip attach/detach | COMPLETED | TripController | TripAttachDetachTest (8) | green | — |
| 2 — Fork route versioning | COMPLETED | routes/api.php, TripController | suite | green | — |
| 3 — Fork documentation | COMPLETED | routes/api.php | — | comment in place | — |
| 4 — Agency state transitions | COMPLETED | AgencyAssignmentService/model/policy | (9) + StateTransition (4) | green | — |
| 5 — Hotel validation | COMPLETED | Hotel requests | HotelTest extended | green | — |
| 6 — Survey validation | COMPLETED | Survey requests/controller/factory | SurveyValidationTest (10) | green | — |
| 7 — Trip authorization | COMPLETED | TripController, Trip.php | suite | green | — |
| 8 — AI rate limiting | COMPLETED | config/ai.php, provider, routes | AiRateLimitTest (4) | green | tuning via env |
| 9 — Role mass assignment | COMPLETED | Role.php | RoleMassAssignmentTest (4) | green | — |
| 10 — Agency endpoints | COMPLETED | controllers/service/repo/routes | AgencyAssignmentCompletionTest (9) | green | — |
| 11 — Soft-delete migration strategy | COMPLETED | 10 create migrations + additive | — | Scenarios A/B/C verified | prod DB not run |
| 12 — Migration paths | PARTIALLY COMPLETED | — | — | fresh + existing + partial (SQLite) | production engine NOT verified |
| 13 — Admin trashed records | COMPLETED | 7 repos/interfaces/services/controllers + Hotel/Destination | AdminTrashedRecordsTest (12) | green | — |
| 14 — Restore endpoints | COMPLETED | 9 admin controllers + routes | AdminRestoreTest (8) | green | — |
| 15 — Unique constraints | COMPLETED | — | — | no unique fields on soft-deletable tables | — |
| 16 — Cascade behavior | COMPLETED | — | — | semantics documented | trashed parent/child visibility |
| 17 — Soft-delete feature tests | COMPLETED | 2 test files | 20 tests | green | — |
| 18 — Full regression | COMPLETED | — | 181 tests / 552 assertions | 0 failures | — |
| 19 — Audit documentation | COMPLETED | docs/audits/2026-08-10-consolidated-backend-audit.md | — | reviewed | — |
| 20 — Final execution report | COMPLETED | docs/final/execution-report.md | — | this document | see report |

Allowed statuses:

```text
COMPLETED
PARTIALLY COMPLETED
NOT APPLICABLE
BLOCKED
SKIPPED
```

---

# 13. FINAL COVERAGE MATRIX

Report actual numbers only.

```text
Routes inspected:
Controllers inspected:
Models inspected:
Policies inspected:
Form Requests inspected:
Services/Actions inspected:
Migrations inspected:
Tests executed:
Soft-delete models inspected:
Restore endpoints verified:
```

If an area was not inspected:

```text
NOT VERIFIED
Reason:
```

Never fabricate coverage.

---

# 14. FINAL SECURITY REGRESSION CHECK

After all implementation work, perform a focused regression review.

## Authentication

Check:

- authentication bypass;
- token leakage;
- brute force;
- password reset;
- session/token behavior.

## Authorization

Check:

- IDOR;
- ownership bypass;
- role escalation;
- permission bypass;
- admin endpoint exposure.

## Input

Check:

- mass assignment;
- missing validation;
- SQL injection;
- unsafe file input;
- unsafe URLs.

## Business Logic

Check:

- invalid state transitions;
- duplicate operations;
- replay;
- race conditions;
- unauthorized state changes.

## Infrastructure

Check:

- debug exposure;
- secrets;
- unsafe CORS;
- public storage;
- exposed debug/admin tools.

## Dependencies

Check significant packages for known issues using the project's available dependency tooling.

Do not turn this into an unrelated full audit unless a new critical vulnerability is discovered.

---

# 15. STOP CONDITIONS

Immediately stop the affected phase and report if:

- migration history is ambiguous;
- database state cannot safely be determined;
- a migration could cause data loss;
- existing local changes conflict with the planned fix;
- the current architecture differs materially from the audit;
- an API change may break consumers;
- package behavior differs from assumptions;
- required dependencies are missing;
- required tests cannot safely run;
- production access would be required to continue;
- implementation would require unrelated architectural redesign.

Do not guess.

---

# 16. CHANGE CONTROL

## Allowed

- required bug fixes;
- security hardening;
- required validation;
- required policies;
- required tests;
- required migration corrections;
- narrowly scoped documentation updates.

## Not allowed unless explicitly required

- Laravel upgrades;
- PHP upgrades;
- dependency upgrades;
- architecture rewrites;
- controller-wide refactors;
- repository/service introduction;
- API redesign;
- frontend changes;
- production database changes;
- unrelated cleanup.

---

# 17. NO FRONTEND WORK

This execution is **backend-only**.

Do not modify:

```text
frontend
HTML
CSS
JavaScript
UI
frontend routing
frontend state management
```

If a frontend issue is discovered because of an API contract problem:

1. document the backend/API implication;
2. do not modify the frontend;
3. report the required frontend follow-up separately.

---

# 18. COMPLETION CRITERIA

The remediation is successful only when:

```text
[ ] Phase 0 completed
[ ] All applicable phases have explicit status
[ ] P0/P1 issues are resolved or explicitly blocked
[ ] Current code was verified before each fix
[ ] Existing local work was preserved
[ ] API contracts were reviewed before route changes
[ ] Authentication remains correct
[ ] Authorization remains correct
[ ] Business state transitions are protected
[ ] Input validation is enforced
[ ] AI endpoints have appropriate rate limiting
[ ] Soft-delete migrations are safe
[ ] Fresh migration path works
[ ] Existing migration path works
[ ] Partial-migration scenario is addressed
[ ] Soft-deleted records can be managed appropriately
[ ] Restore behavior is tested
[ ] Unique constraints were investigated
[ ] Cascade behavior was investigated
[ ] Relevant feature tests pass
[ ] Full regression suite was executed
[ ] No tests were weakened to hide failures
[ ] No secrets were introduced
[ ] No destructive production actions were performed
[ ] Final diff was reviewed
[ ] Audit documentation reflects actual state
[ ] Remaining risks are documented
```

---

# 19. FINAL RESPONSE REQUIREMENT

At the end, provide a concise executive summary:

```text
OVERALL STATUS:
<Completed / Partially Completed / Blocked>

CRITICAL FIXES:
- ...

SECURITY:
- ...

DATABASE:
- ...

BUSINESS LOGIC:
- ...

TESTING:
- ...

DOCUMENTATION:
- ...

BLOCKED ITEMS:
- ...

REMAINING RISKS:
- ...

NEXT ACTIONS:
- ...
```

Then provide the complete Phase 0–20 status table.

---

# FINAL INSTRUCTION

Execute this plan as a **controlled remediation process**, not a blind coding task.

For every phase:

```text
VERIFY
→ UNDERSTAND
→ IMPLEMENT
→ TEST
→ REGRESS
→ REVIEW
→ REPORT
```

The current codebase is the authority for implementation details.

The audit is the authority for the original findings.

The database's actual migration state is the authority for database history.

Tests and runtime verification are the authority for whether a fix actually works.

When these disagree:

> **Investigate the disagreement instead of guessing.**

Never report a phase as complete merely because code was written.

Never claim an environment was verified when it was not accessible.

Never claim a database migration is safe without testing the relevant migration state.

Never modify production simply to satisfy a verification step.

At the end, the project owner must be able to answer:

> **What was fixed? What was verified? What was not verified? What changed? What remains risky? What is blocked? And why?**