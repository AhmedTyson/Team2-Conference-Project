# Tasks: 5-Domain Architecture Reorganization

## Phase 1: Housekeeping & Cleanup
### Task 1: Resolve Cleanup Checklist
**Description:** Execute the one-time cleanup checklist from Section 7 of the spec.
**Acceptance criteria:**
- [x] Identify and resolve `Interfaces/` vs `Repositories/` count mismatch.
- [x] Resolve `DestinationController.php` duplicate (`Admin/` vs top-level).
- [x] Fix migration typos (`create_resturants_table` -> `create_restaurants_table`, `creat_itinerary_item_table` -> `create_itinerary_item_table`).
- [x] Flatten `docs/scripts/scripts/` -> `docs/scripts/`.
- [x] Delete `refine-upload/`, `frontend.zip`, `tree.txt`, `gen-tree.ps1`.
- [x] Move `test-err.php`, `test-ssl.php`, `load_test.php` -> `scripts/`.
- [x] Consolidate root-level `*.md` audit/plan files into `docs/audits/` and `docs/plans/`.
**Verification:**
- [x] `php artisan test` passes.
**Files likely touched:** Multiple docs, migrations, root files.

---

## Phase 2: Domain Migrations

### Task 2: Migrate 'System' Domain
**Description:** Move all System-related files into `System/` subdirectories and update namespaces.
**Acceptance criteria:**
- [x] Move System Models, Repositories, Interfaces, Services, Controllers, Requests, and Tests (Settings, ContactMessages, Reports, etc.).
- [x] Global search & replace for `App\Models\Setting` -> `App\Models\System\Setting`, etc.
- [x] Update `AppServiceProvider` bindings.
**Verification:**
- [x] `composer dump-autoload` and `php artisan test` pass.

### Task 3: Migrate 'Account' Domain
**Description:** Move User, Auth, Profile files into `Account/`.
**Acceptance criteria:**
- [x] Move Account Models, Repos, Interfaces, Services, Controllers, Requests, Tests.
- [x] Update namespaces globally.
- [x] Update `AppServiceProvider`.
**Verification:**
- [x] `php artisan test --filter User` and `Auth` pass.

### Task 4: Migrate 'Catalog' Domain
**Description:** Move Attractions, Categories, Countries, Destinations, Hotels, Restaurants files into `Catalog/`.
**Acceptance criteria:**
- [x] Move Catalog Models, Repos, Interfaces, Services, Controllers, Requests, Tests.
- [x] Update namespaces globally.
- [x] Update `AppServiceProvider`.
**Verification:**
- [x] `php artisan test` passes.

### Task 5: Migrate 'Trips' Domain
**Description:** Move Trips, ItineraryItems, AI, Map, Reviews files into `Trips/`.
**Acceptance criteria:**
- [x] Move Trips Models, Repos, Interfaces, Services, Controllers, Requests, Tests.
- [x] Update namespaces globally.
- [x] Update `AppServiceProvider`.
**Verification:**
- [x] `php artisan test` passes.

### Task 6: Migrate 'Commerce' Domain
**Description:** Move Bookings, Payments, Subscriptions, Plans, Orders into `Commerce/`.
**Acceptance criteria:**
- [x] Move Commerce Models, Repos, Interfaces, Services, Controllers, Requests, Tests.
- [x] Update namespaces globally.
- [x] Update `AppServiceProvider`.
**Verification:**
- [x] All tests pass.

---

## Phase 3: Final Polish

### Task 7: Directory Structure Audit (COMPLETED 2026-08-09)
**Description:** Ensure the remaining flat directories are completely empty of migrated classes.
**Acceptance criteria:**
- [x] Verify `app/Models/` root has no lingering models.
- [x] Verify `app/Services/` root has no lingering domain services (except Gateways/External if instructed).
- [x] Verify `AppServiceProvider` uses exactly the new paths.
**Verification:**
- [x] Complete `php artisan test` passes cleanly.
