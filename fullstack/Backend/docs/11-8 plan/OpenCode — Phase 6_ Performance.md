# OpenCode — Phase 6: Performance

**Status:** 🟡 In Progress
**Date:** 2026-08-12
**Baseline:** 254 tests, 807 assertions, 0 failures
**Objective:** Fix two confirmed performance findings with minimal queries.

---

## Phase Overview

Phase 6 addresses performance issues identified in the deep backend audit:
- **PERF-01** (MEDIUM): Admin analytics loads entire trips table into memory
- **PERF-02** (LOW): Agency pagination uses unbounded `get()` instead of `paginate()`

**Constraint:** Only make query changes if directly necessary to enforce correctness or concurrency. Correctness takes priority over premature optimization.

---

## PERF-01: Admin Analytics SQL Aggregation

### Finding Details

| Field | Value |
|-------|-------|
| Severity | MEDIUM |
| Category | Performance / Query efficiency |
| Component | Commerce / Analytics |
| File | `app/Http/Controllers/Commerce/AdminAnalyticsController.php:28-39` |
| Method | `revenue()` |
| Current Behavior | `Trip::whereIn('status', booked)->select('budget','start_date')->get()` materializes every booked trip, then groupBy in PHP. Unbounded — degrades linearly with trip count. |
| Expected Behavior | Aggregate in SQL (GROUP BY strftime/date_trunc) or chunked streaming. Route is permission-gated but admin-facing and cached nowhere. |
| Impact | Admin dashboard request latency + memory spikes at scale. |
| Exploit Scenario | Admin triggers repeatedly; no security impact. |
| Affected Users | Admins. |
| Recommended Direction | SQL aggregation (date_trunc on Postgres), add response cache. |
| Test Needed | Test with many trips asserting bounded query count / time. |
| Confidence | CONFIRMED |

### Current Code

```php
// app/Http/Controllers/Commerce/AdminAnalyticsController.php:28-39
public function revenue()
{
    $booked = [TripStatus::PAID->value, TripStatus::FULFILLED->value];

    $trips = Trip::whereIn('status', $booked)
        ->select('budget', 'start_date')
        ->get();

    $monthlyRevenue = [];

    foreach ($trips as $trip) {
        $date = Carbon::parse($trip->start_date)->format('Y-m');
        if (!isset($monthlyRevenue[$date])) {
            $monthlyRevenue[$date] = 0;
        }
        $monthlyRevenue[$date] += $trip->budget;
    }

    return response()->json([
        'monthly_revenue' => $monthlyRevenue,
    ]);
}
```

### Implementation Plan

1. **Analyze current usage:**
   - Route: Permission-gated (admin-only)
   - Cache: No caching
   - Response: JSON with monthly revenue

2. **Implement SQL aggregation:**
   - Use `groupBy('month')` on start_date
   - Use `selectRaw('SUM(budget) as total, DATE(start_date) as month')`
   - Handle date formatting in PHP or SQL

3. **Add response cache:**
   - Cache for 5 minutes (admin dashboard refresh rate)
   - Use `Cache::remember()` with key based on auth user ID

4. **Add tests:**
   - Test with 1000 trips
   - Verify query count is bounded (not N+1)
   - Verify response matches expected format

5. **Verify no regressions:**
   - Run Phase 4 tests
   - Run SEC-04, SEC-10, SEC-11 tests
   - Run full test suite

### Files to Modify

- `app/Http/Controllers/Commerce/AdminAnalyticsController.php` — revenue() method
- `tests/Feature/Commerce/AdminAnalyticsTest.php` — add performance tests

### Definition of Done

- ✅ SQL aggregation replaces PHP groupBy
- ✅ Response cache added (5 minutes)
- ✅ Test with 1000 trips passes
- ✅ Query count is bounded
- ✅ No regression in Phase 4 tests
- ✅ No regression in security tests

---

## PERF-02: Agency Pagination

### Finding Details

| Field | Value |
|-------|-------|
| Severity | LOW |
| Category | Performance / Query efficiency |
| Component | Performance / Query efficiency |
| Current Behavior | `get()` on agencies table |
| Expected Behavior | Use `paginate()` instead of `get()` |
| Impact | Latency at scale. |
| Recommended Direction | Add pagination. |
| Confidence | CONFIRMED |

### Current Code

```php
// app/Http/Controllers/Commerce/AdminAgencyController.php
// (needs investigation)
$agencies = Agency::get(); // Unbounded
```

### Implementation Plan

1. **Investigate current usage:**
   - Find all `Agency::get()` calls
   - Identify which endpoints need pagination
   - Determine appropriate page size

2. **Add pagination:**
   - Use `paginate(20)` or `paginate(50)`
   - Return meta data (total, per_page, current_page)

3. **Update tests:**
   - Verify pagination works
   - Verify meta data is correct

4. **Verify no regressions:**
   - Run full test suite

### Files to Investigate

- `app/Http/Controllers/Commerce/AdminAgencyController.php`
- `tests/Feature/Commerce/AdminAgencyTest.php`

### Definition of Done

- ✅ All `Agency::get()` calls replaced with `paginate()`
- ✅ Pagination works correctly
- ✅ Meta data returned correctly
- ✅ No regression in tests

---

## Out-of-Scope

Phase 6 does NOT include:
- ❌ Query optimization for other endpoints
- ❌ Database index optimization (deferred to Phase 8)
- ❌ Caching strategy for all endpoints (deferred to Phase 8)
- ❌ Query optimization for Phase 4 business logic (correctness priority)

---

## Test Strategy

### Regression Tests

After each fix:
```bash
# Run Phase 4 tests
php artisan test --filter="Phase 4"

# Run security tests
php artisan test --filter="SEC-04|SEC-10|SEC-11"

# Run full test suite
php artisan test
```

### Performance Tests

```bash
# Test with large dataset
php artisan test --filter="AdminAnalyticsPerformance"
```

---

## Progress Tracking

### PERF-01 Status
- [ ] Investigate current usage
- [ ] Implement SQL aggregation
- [ ] Add response cache
- [ ] Add performance tests
- [ ] Verify no regressions
- [ ] Document changes

### PERF-02 Status
- [ ] Investigate current usage
- [ ] Add pagination
- [ ] Update tests
- [ ] Verify no regressions
- [ ] Document changes

---

## Next Steps

1. Start with PERF-01 (MEDIUM severity, higher impact)
2. Implement SQL aggregation in `AdminAnalyticsController::revenue()`
3. Add response cache (5 minutes)
4. Add performance tests with 1000 trips
5. Verify no regressions
6. Move to PERF-02 (LOW severity)
7. Add pagination to agency endpoints
8. Verify no regressions
9. Mark Phase 6 complete

---

**Report generated by:** OpenCode Phase 6: Performance
**Next action:** Implement PERF-01 (Admin analytics SQL aggregation)
