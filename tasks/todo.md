## Part 1: Core Architecture & In-App Alerts

### Phase 1: Database Foundation
- [ ] Create/Update `notifications` migration replacing `uuid` with `id` (ulid/bigint) and adding `user_id` foreign key.
- [ ] Migrate database successfully.

### Phase 2: Domain Models
- [ ] Create `Notification` model overriding Laravel's `DatabaseNotification`.
- [ ] Add `notifications()` relationship to `User`.

### Phase 3: Notification Orchestration
- [ ] Create a base `AppNotification` class implementing `via($notifiable)` returning `['database']` for now.

### Phase 4: Queuing & Idempotency
- [ ] Add `ShouldQueue` to the base notification class.
- [ ] Add `middleware()` method returning `new WithoutOverlapping(...)` based on the notification type and user ID.

### Phase 5: User API
- [ ] Build `NotificationController` with `index`, `read`, and `readAll` endpoints.
- [ ] Add routes to `api.php`.

### Phase 6: Performance Layer
- [ ] Refactor `index` query to use `cursorPaginate()`.
- [ ] Implement Redis/Cache increment/decrement for `unread_count` on the User model.

### Phase 7: Admin API
- [ ] Build `AdminNotificationController@index` with type/user filters.
- [ ] Protect with `role:admin` middleware.

### Phase 8: Payment Triggers
- [ ] Create `PaymentStatusNotification`.
- [ ] Dispatch it from `FulfillOrderListener` or `WebhookService`.

### Phase 9: Subscription & Trip Triggers
- [ ] Create `SubscriptionActivatedNotification` and `TripForkedNotification`.
- [ ] Dispatch from respective service methods.

### Phase 10: Auth Triggers & Testing
- [ ] Create `WelcomeNotification` and dispatch on user registration.
- [ ] Write integration test triggering the full flow and assert jobs are pushed to logs.

---

## Part 2: Email Integration & Templates

### Phase 11: Global Email Layout
- [ ] Scaffold `resources/views/emails/layouts/main.blade.php`.

### Phase 12: Financial Mailables
- [ ] Create `resources/views/emails/payment-success.blade.php` and `payment-failed.blade.php`.
- [ ] Create corresponding Mailable classes mapping data to views.

### Phase 13: Social/Trip Mailables
- [ ] Create `resources/views/emails/trip-forked.blade.php`.
- [ ] Create `TripForkedMail` Mailable.

### Phase 14: Auth/Account Mailables
- [ ] Create `resources/views/emails/welcome.blade.php` and `subscription-activated.blade.php`.
- [ ] Create corresponding Mailables.

### Phase 15: Channel Routing & Final Testing
- [ ] Update all Notification classes' `via()` method to return `['database', 'mail']`.
- [ ] Implement `toMail()` on all notifications returning their respective Mailables.
- [ ] Test the full email dispatch pipeline locally (verifying via logs or Mailables test).
