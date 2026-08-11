# Notifications Inventory & Gap Analysis

Date: 2026-08-11
Source: current codebase (read-only inspection), HEAD af2597d.

---

## 1. Notification architecture (how it works)

- Single `notifications` table — hybrid of legacy + native Laravel:
  `id (uuid), title, type, body, data (json), status, user_id (FK), notifiable_type, notifiable_id, read_at, timestamps`
- Model: `App\Models\System\Notification extends DatabaseNotification` — auto-fills `user_id` from `notifiable_id` on create; `user()` relation for admin joins.
- `User` overrides the Notifiable trait's `notifications()` with `hasMany(System\Notification)` — so ALL Laravel database-channel notifications land in this table with `user_id` populated.
- Channels: every notification sends **database (in-app) + mail** (`AppNotification::via`), queued (`ShouldQueue`), with `WithoutOverlapping` dedup lock (class+notifiable, 5-min window).
- Read APIs: `GET /api/v1/notifications` (cursor-paginated + cached unread_count), `PATCH /{id}/read`, `POST /read-all` (NotificationController).
- Admin listing exists: `GET /api/v1/admin/notifications` (AdminNotificationController, filters type/user_id) — **but nothing ever writes via it** (see gaps).

---

## 2. Current notifications (6 active types)

| # | Notification | Trigger (file:line) | Recipient | Content (in-app) | Mail |
|---|---|---|---|---|---|
| 1 | WelcomeNotification | Register — AuthController.php:37 | new user | "Welcome to our platform! Start planning your next trip." | WelcomeMail |
| 2 | PaymentSucceededNotification | Webhook success + fulfillment OK — FulfillOrderListener.php:71 | order buyer | order_id, amount_cents, "Your payment was successful." | PaymentSuccessMail |
| 3 | PaymentFailedNotification | (a) Webhook failure — HandlePaymentFailed.php:22; (b) fulfillment exception, order → FAILED — FulfillOrderListener.php:63 | order buyer | order_id, "Your recent payment attempt failed." | PaymentFailedMail |
| 4 | TripBookedNotification | trip_package fulfillment — FulfillOrderListener.php:90 | package buyer | trip_id, "Your trip X has been successfully booked." | Trip Booked mail |
| 5 | TripForkedNotification | fork fulfillment — TripForkService.php:68 | **source trip owner** | forked/original trip ids, "Your trip X was forked by another user." | TripForkedMail |
| 6 | SubscriptionActivatedNotification | subscription fulfillment — FulfillOrderListener.php:148 | subscriber | subscription_id, plan_name, "Your subscription has been successfully activated." | SubscriptionActivatedMail |

Notes:
- All 6 inherit mail+database channels; TripBookedNotification extends bare Notification (mail+database explicitly) — no dedup middleware (low risk: listener guards idempotency).
- No other `->notify()` call sites exist in the codebase (grep verified).

---

## 3. Notification cascade on payment confirmation (webhook → PaymentSucceeded)

```
Webhook OK ──► PaymentSucceeded ──► FulfillOrderListener (queued)
                │
                ├─ order.status: pending → paid → fulfilled (transaction)
                │
                ├─ [plan]        → Subscription created (status=active, renews_at=+1m/+1y)
                │                  → SUBSCRIBER: SubscriptionActivatedNotification (#6)
                │
                ├─ [trip_fork]   → Trip copy created for buyer
                │                  → SOURCE OWNER: TripForkedNotification (#5)
                │                  → BUYER: NO fork-ready notification ⚠
                │
                ├─ [trip_package]→ trip.status → booked
                │                  → BUYER: TripBookedNotification (#4)
                │
                └─ always       → BUYER: PaymentSucceededNotification (#2)
Webhook fail ──► PaymentFailed  ──► BUYER: PaymentFailedNotification (#3)
Fulfillment exception ──► order → FAILED ──► BUYER: PaymentFailedNotification (#3)
Register ──► WelcomeNotification (#1)
```

---

## 4. Gaps — what has NO notification

| Area | Missing notification | Context | Ties to |
|---|---|---|---|
| Fork buyer | No "your fork copy is ready / fork created" notice | Buyer pays, gets only generic payment-success; only source owner is told (asymmetry) | D1 (fork policy), Phase 4 |
| Pending order | No abandonment/expiry notice | D5: orders expire at 30m+24h grace — user never told their checkout expired | D5, Phase 2 |
| Subscription expiry | No expiry notice / renewal reminder | D2-C fixed-term pack: term ends, quota stops — user uninformed; no re-purchase reminder | D2, Phase 4 |
| Subscription cancel | No cancellation confirmation | PlanService::cancel flips status silently | D2, Phase 4 |
| Account block/unblock | No notice to user (nor to admin) | Admin blocks — user gets nothing (would also prevent "why am I locked out" confusion) | SEC-01, Phase 1 |
| Admin side | **Zero admin notifications exist** | `admin/notifications` endpoint + System\Notification.user_id exist, but NOTHING creates rows: no new-order, no payment-failed, no webhook-error, no contact-message alerts for admins | Phase 3 ops |
| Contact form | No submission ack / no reply notification | ContactController stores message, returns 201; admin reply flow (if any) sends no in-app notice | ops |
| Agency workflow | No assignment created/removed notice | AgencyAssignmentController silent for both customer and agency user | ops |
| Quota | No quota-exhaustion warning / AI-done notice | AiUsageService blocks silently; user hits 403 without explanation | SEC-11, Phase 4 |
| Security | No login-from-new-device / suspicious-event notice | none exists | ops |

---

## 5. Mechanics quirks (recorded, non-blocking)

- `unread_count` cached 1h (NotificationController.php:21-24) — count can go stale (new notification appears up to 1h late); markAsRead decrements, read-all sets 0.
- Legacy columns retained nullable (title/body/status) — harmless, migration `..._235754_alter_notifications_table`-style comments note SQLite PK limitation.
- All deliveries queued → depend on queue worker; mail via log driver in dev (no real emails locally).
- No push/SMS/WhatsApp channels — database + mail only.

---

## 6. Recommendation (recorded, action in later phases)

- Phase 2/4 additions (must ship with D2/D5): fork-ready (buyer), order-expired, subscription-expired, renewal reminder, cancel confirmation.
- Phase 1: blocked-account notice.
- Phase 3: admin alert writer (new-order, payment-failed, webhook-error, contact-message) — one listener + one channel, feeds existing AdminNotificationController.
- Fix unread-count cache staleness while touching NotificationController.
