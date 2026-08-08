# Notifications Feature Plan

## 1. Overview
Implement a high-performance Hybrid Notifications system combining the analytical benefits of `Team3-backend` (strict User relationships) with the scalability of Laravel 11 native mechanics (Channels, Reverb, Overlap Middlewares). The project is divided into 10 Core Architectural Phases, followed by 5 dedicated Email Template Phases to replicate the exact business logic and aesthetic layout from Team 3.

## 2. Dependency Graph
```
Custom Notifications Table (Migration)
    │
    ├── Notification Model & User Relation
    │       │
    │       ├── Laravel Notification Classes (ShouldQueue, WithoutOverlapping)
    │       │       │
    │       │       ├── API Controllers (Cursor Pagination, Redis Badge)
    │       │       │       │
    │       │       │       └── Business Triggers (Payment, Trips, Auth)
    │       │       │
    │       │       └── Email Phase (Blade Layouts & Mailables)
```

## 3. The 15-Phase Execution Plan

### Part 1: Core Architecture & In-App Alerts (Phases 1 - 10)
1.  **Phase 1: High-Performance Database Foundation.** Override default notifications migration to use `id` (ULID/BigInt) and strict `user_id` foreign keys for fast querying.
2.  **Phase 2: Domain Models.** Setup `Notification` model with explicit polymorphism. Update `User` relationships.
3.  **Phase 3: Notification Orchestration.** Create base `AppNotification` abstract class extending Laravel's `Notification` with `via()` method pre-configured.
4.  **Phase 4: Queuing & Idempotency.** Apply `ShouldQueue` and `WithoutOverlapping` middleware to naturally prevent duplicate webhooks from generating duplicate alerts.
5.  **Phase 5: User API.** Build `NotificationController` (`index`, `markAsRead`, `markAllAsRead`).
6.  **Phase 6: Performance Layer.** Implement Cursor Pagination for the `index` endpoint and Cache-based unread counters (O(1) complexity).
7.  **Phase 7: Admin API.** Build `AdminNotificationController` for system-wide auditing and filtering.
8.  **Phase 8: Payment Triggers.** Hook notifications into `PaymentSucceeded` and `PaymentFailed` events.
9.  **Phase 9: Subscription & Trip Triggers.** Hook notifications into new subscriptions and Trip Fork events.
10. **Phase 10: Auth Triggers.** Hook notifications into new user registration. Log results.

### Part 2: Email Integration & Templates (Phases 11 - 15)
11. **Phase 11: Global Email Layout.** Create `resources/views/emails/layouts/main.blade.php` to match Team 3's high-quality aesthetic.
12. **Phase 12: Financial Mailables.** Create Blade views and Mailables for `PaymentSuccessMail` and `PaymentFailedMail`.
13. **Phase 13: Social/Trip Mailables.** Create Blade views and Mailables for `TripForkedMail`.
14. **Phase 14: Auth/Account Mailables.** Create Blade views and Mailables for `WelcomeMail` and `SubscriptionActivatedMail`.
15. **Phase 15: Channel Routing & Testing.** Inject these Mailables into the `toMail()` methods of our Phase 8-10 Notifications and test log output.
