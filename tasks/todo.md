# Tasks: 5-Domain Architecture Reorganization

## Phase 1: Housekeeping & Cleanup
### Task 1: Resolve Cleanup Checklist
**Description:** Execute the one-time cleanup checklist from Section 7 of the spec.
**Acceptance criteria:**
- [ ] Identify and resolve `Interfaces/` vs `Repositories/` count mismatch.
- [ ] Resolve `DestinationController.php` duplicate (`Admin/` vs top-level).
- [ ] Fix migration typos (`create_resturants_table` -> `create_restaurants_table`, `creat_itinerary_item_table` -> `create_itinerary_item_table`).
- [ ] Flatten `docs/scripts/scripts/` -> `docs/scripts/`.
- [ ] Delete `refine-upload/`, `frontend.zip`, `tree.txt`, `gen-tree.ps1`.
- [ ] Move `test-err.php`, `test-ssl.php`, `load_test.php` -> `scripts/`.
- [ ] Consolidate root-level `*.md` audit/plan files into `docs/audits/` and `docs/plans/`.
**Verification:**
- [ ] `php artisan test` passes.
**Files likely touched:** Multiple docs, migrations, root files.

---

## Phase 2: Domain Migrations

### Task 2: Migrate 'System' Domain
**Description:** Move all System-related files into `System/` subdirectories and update namespaces.
**Acceptance criteria:**
- [ ] Move System Models, Repositories, Interfaces, Services, Controllers, Requests, and Tests (Settings, ContactMessages, Reports, etc.).
- [ ] Global search & replace for `App\Models\Setting` -> `App\Models\System\Setting`, etc.
- [ ] Update `AppServiceProvider` bindings.
**Verification:**
- [ ] `composer dump-autoload` and `php artisan test` pass.

### Task 3: Migrate 'Account' Domain
**Description:** Move User, Auth, Profile files into `Account/`.
**Acceptance criteria:**
- [ ] Move Account Models, Repos, Interfaces, Services, Controllers, Requests, Tests.
- [ ] Update namespaces globally.
- [ ] Update `AppServiceProvider`.
**Verification:**
- [ ] `php artisan test --filter User` and `Auth` pass.

### Task 4: Migrate 'Catalog' Domain
**Description:** Move Attractions, Categories, Countries, Destinations, Hotels, Restaurants files into `Catalog/`.
**Acceptance criteria:**
- [ ] Move Catalog Models, Repos, Interfaces, Services, Controllers, Requests, Tests.
- [ ] Update namespaces globally.
- [ ] Update `AppServiceProvider`.
**Verification:**
- [ ] `php artisan test` passes.

### Task 5: Migrate 'Trips' Domain
**Description:** Move Trips, ItineraryItems, AI, Map, Reviews files into `Trips/`.
**Acceptance criteria:**
- [ ] Move Trips Models, Repos, Interfaces, Services, Controllers, Requests, Tests.
- [ ] Update namespaces globally.
- [ ] Update `AppServiceProvider`.
**Verification:**
- [ ] `php artisan test` passes.

### Task 6: Migrate 'Commerce' Domain
**Description:** Move Bookings, Payments, Subscriptions, Plans, Orders into `Commerce/`.
**Acceptance criteria:**
- [ ] Move Commerce Models, Repos, Interfaces, Services, Controllers, Requests, Tests.
- [ ] Update namespaces globally.
- [ ] Update `AppServiceProvider`.
**Verification:**
- [ ] All tests pass.

---

## Phase 3: Final Polish

### Task 7: Directory Structure Audit
**Description:** Ensure the remaining flat directories are completely empty of migrated classes.
**Acceptance criteria:**
- [ ] Verify `app/Models/` root has no lingering models.
- [ ] Verify `app/Services/` root has no lingering domain services (except Gateways/External if instructed).
- [ ] Verify `AppServiceProvider` uses exactly the new paths.
**Verification:**
- [ ] Complete `php artisan test` passes cleanly.
