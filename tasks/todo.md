## Email UI/UX & Testing (5 Phases)

### Phase 1: Marketing-Grade UI/UX Design
**Description:** Transform the basic HTML emails into beautiful, premium marketing assets.
- [ ] Overhaul `resources/views/emails/layouts/main.blade.php` with a modern, responsive layout (max-width 600px, centered, rounded corners, soft shadows).
- [ ] Add a premium header (Logo placement, brand colors) and a marketing footer (social icons, copyright, support links).
- [ ] Redesign `payment-success.blade.php` and `payment-failed.blade.php` with distinct trust signals (green/red accents, receipt-like tables).
- [ ] Redesign `welcome.blade.php` with a hero image placeholder and onboarding steps.
- [ ] Redesign `trip-forked.blade.php` with social proof elements.
- [ ] Redesign `subscription-activated.blade.php` highlighting premium features.

### Phase 2: Mailable Visual Previews
**Description:** Enable local browser previewing of the new email templates.
- [ ] Create a `routes/web.php` endpoint `/mail-preview` (restricted to local environment).
- [ ] Instantiate dummy data (Mock `User`, `Order`, `Trip`) and return the Mailables (e.g., `return new WelcomeMail($user);`).
- [ ] Visually verify responsiveness and typography across mobile/desktop views.

### Phase 3: Routing & Integration Tests
**Description:** Ensure business logic correctly triggers the Mailables with exact data.
- [ ] Write `test_welcome_email_dispatched_on_register` in `Tests\Feature\AuthTest.php` (or similar).
- [ ] Write `test_payment_success_email_contains_order_details` verifying the Mailable content includes the correct currency and amount.
- [ ] Assert `Mail::assertSent()` passes for all 5 email types.

### Phase 4: Concurrency & Idempotency Tests
**Description:** Prove that the system prevents duplicate email spam during race conditions.
- [ ] Write a test that fires `PaymentSucceeded` twice instantly.
- [ ] Assert that the `PaymentSucceededNotification` is queued, but the overlapping lock prevents the second email from being dispatched.
- [ ] Verify `WithoutOverlapping` middleware behaves correctly.

### Phase 5: E2E Mail Delivery & Log Verification
**Description:** Run the full pipeline and verify the final compiled output in the logs.
- [ ] Set `MAIL_MAILER=log` in `.env` (or override in PHPUnit).
- [ ] Run the E2E checkout feature test.
- [ ] Assert or manually verify that `storage/logs/laravel.log` contains the fully rendered, minified HTML structure of the marketing emails.
