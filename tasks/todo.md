## Task 1: Update Notifications Table & Model

**Description:** Refactor the existing `notifications` table to strictly match the `Team3-backend` schema (which relies on `read_at` timestamps instead of a `status` enum, and supports polymorphic `notifiable` relationships).

**Acceptance criteria:**
- [ ] Migration alters `notifications` table: drops `status`, `title`, `body` (Team 3 uses implicit titles based on type or `data` JSON). Adds `notifiable_type`, `notifiable_id`, and `read_at` (timestamp).
- [ ] `Notification` model updated to remove `NotificationStatus` enum, add the `notifiable()` polymorphic relationship.
- [ ] `User` model confirmed to have `notifications()` HasMany relationship.

**Verification:**
- [ ] Run `php artisan migrate` successfully.
- [ ] Manual check: Model correctly typed and relationships are valid.

**Dependencies:** None

**Files likely touched:**
- `database/migrations/*_alter_notifications_table.php`
- `app/Models/Notification.php`

**Estimated scope:** Small: 2 files

---

## Task 2: Implement Background Job and NotificationService

**Description:** Build the `SendNotificationJob` which handles inserting the record into the database and sending an email if requested. Build the `NotificationService` as the single entry point.

**Acceptance criteria:**
- [ ] `SendNotificationJob` implements `ShouldQueue`.
- [ ] Job checks for duplicate notifications (idempotency over a 5-minute window for identical `user_id` and `type`).
- [ ] `NotificationService::notify(User $user, string $type, array $data, bool $sendEmail)` successfully dispatches the job.

**Verification:**
- [ ] Tests pass or manual test via `php artisan tinker`.
- [ ] Job successfully creates a DB row when processed.

**Dependencies:** Task 1

**Files likely touched:**
- `app/Jobs/SendNotificationJob.php`
- `app/Services/NotificationService.php`

**Estimated scope:** Small: 2 files

---

## Checkpoint: Foundation Complete
- [ ] Migrations run cleanly.
- [ ] `NotificationService` successfully queues jobs and writes to the DB.

---

## Task 3: Build User Notification API

**Description:** Implement `NotificationController` and `NotificationResource` to allow end-users to view and manage their in-app notifications.

**Acceptance criteria:**
- [ ] `GET /api/v1/notifications` returns paginated notifications with an `unread_count` meta field.
- [ ] `PATCH /api/v1/notifications/{id}/read` marks a specific notification as read.
- [ ] `PATCH /api/v1/notifications/read-all` marks all unread notifications as read.
- [ ] Authorization ensures users can only access their own notifications.

**Verification:**
- [ ] Endpoints exist and return HTTP 200.
- [ ] Feature tests written and pass.

**Dependencies:** Task 2

**Files likely touched:**
- `app/Http/Controllers/NotificationController.php`
- `app/Http/Resources/NotificationResource.php`
- `routes/api.php`
- `tests/Feature/NotificationTest.php`

**Estimated scope:** Medium: 4 files

---

## Task 4: Build Admin Notification API

**Description:** Implement `AdminNotificationController` for platform administrators to audit system notifications.

**Acceptance criteria:**
- [ ] `GET /api/v1/admin/notifications` returns latest platform notifications.
- [ ] Response includes the related `user` (id, name, email).
- [ ] Supports filtering by `type`.
- [ ] Protected by `role:admin|super_admin` or specific permissions.

**Verification:**
- [ ] Endpoint is protected and accessible only by admins.
- [ ] Feature test confirms filtering works.

**Dependencies:** Task 1

**Files likely touched:**
- `app/Http/Controllers/Admin/AdminNotificationController.php`
- `routes/api.php`
- `tests/Feature/Admin/AdminNotificationTest.php`

**Estimated scope:** Medium: 3 files

---

## Checkpoint: API Complete
- [ ] All feature tests for User and Admin endpoints pass.
- [ ] API routes are cleanly organized in `routes/api.php`.
