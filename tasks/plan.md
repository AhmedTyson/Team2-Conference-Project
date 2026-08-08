# Notifications Feature Plan

## 1. Overview
Implement a robust, generic Notifications system matching the architectural pattern established in `Team3-backend`. This will replace or standardize any existing notification mechanisms with a custom `notifications` table, a centralized `NotificationService`, a background Queue Job (`SendNotificationJob`), and standard User/Admin API controllers.

## 2. Dependency Graph
```
Custom Notifications Table (Migration)
    │
    ├── Notification Model & User Relation
    │       │
    │       ├── SendNotificationJob (Queue Job)
    │       │       │
    │       │       └── NotificationService (Orchestrator)
    │       │               │
    │       │               ├── NotificationController (User API)
    │       │               │
    │       │               └── AdminNotificationController (Admin API)
```

## 3. Risks and Unknowns
*   **Queue Worker Required**: The background job requires a queue worker to be active. Tests must use `Queue::fake()`.
*   **Idempotency**: Preventing duplicate notifications (e.g., if a system double-fires an event) needs a time-window check inside the job.
*   **Mailable Mapping**: We will leave the specific email mappings (Mailable classes) generic or as a stub, since email templates depend on the exact notification type (e.g., `payment_success`, `trip_forked`).

## 4. Vertical Slices
*   **Slice 1: Foundation (DB & Domain)**
    Update the existing `notifications` table to match Team 3's schema (adding `notifiable_type`, `notifiable_id`, replacing `status` with `read_at`). Update the `Notification` model, and setup the Background Job and Service.
*   **Slice 2: User API Endpoints**
    Build `NotificationController` to list, mark as read, and clear unread badges.
*   **Slice 3: Admin API Endpoints**
    Build `AdminNotificationController` for platform-wide auditing of notifications.
