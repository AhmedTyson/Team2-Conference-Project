# Backend — Business Workflow Inventory

State machines verified from enums, models, commands, and tests. Transition enforcement varies — noted per workflow.

## 1. Trip lifecycle

| State | Meaning |
|---|---|
| pending | Draft |
| planning | Being planned |
| booked | Reserved/booked |
| completed | Finished |
| cancelled | Abandoned |

- Enum: `TripStatus` (app/Enums/TripStatus.php). Column: `trips.status`.
- Who: user (own trip), admin (via update).
- Enforcement: `UpdateTripRequest` validates `status in:planned,active,completed,cancelled` — NOTE: includes `active` not in enum; transitions NOT enforced by state machine (any listed value assignable). Soft-delete drives a parallel hidden state (deleted→restore).
- Tests: TripAccessControlTest (ownership), AdminTrashedRecordsTest (delete/restore).

## 2. Order lifecycle (commerce)

| State | Transition Trigger |
|---|---|
| pending | Checkout → order created, `expires_at` = +30min |
| paid | Webhook PaymentSucceeded |
| fulfilled | FulfillOrderListener after fulfillment of product |
| failed | Webhook PaymentFailed / fulfillment failure rollback |
| cancelled | User/flow cancellation |
| refunded | Admin/manual (enum value only — no command verified) |
| expired | `orders:expire-stale` everyMinute: pending past 30min |

- Enum: `OrderStatus`. Column: `orders.status`, index (user_id,status),(user_id,idempotency_key).
- Tests: OrderLifecycleTest (expiry, grace, terminal states, races), PaymentFlowTest (checkout→webhook→fulfillment), CheckoutAbuseTest.

## 3. Payment lifecycle

| State | Transition Trigger |
|---|---|
| pending | Intention created |
| processing | Gateway processing |
| paid | Webhook verified |
| failed | Webhook failure / timeout |
| cancelled | Gateway/cancel |
| refunded | Manual (enum only) |

- Enum: `PaymentStatus`. Column: `payments.status`. Payments are append-only (UPDATED_AT null), encrypted raw_payload.
- 24h grace deadline for webhook; cache lock dedup; HMAC gate.
- Tests: PaymentFlowTest, ConcurrencyTest, PaymentSensitiveDataTest, PaymobTimeoutTest.

## 4. Subscription lifecycle

| State | Transition Trigger |
|---|---|
| pending | Create intent |
| active | Paid (default status in migration) |
| past_due | Renewal failure (enum value; no verified command writes it) |
| cancelled | PlanService@cancel |
| expired | `subscriptions:expire-stale` everyMinute: renews_at passed |
| paused | Enum value only — no verified trigger |

- Enum: `SubscriptionStatus`. Column: `subscriptions.status`; partial unique `subscriptions_active_user_unique` (one active per user); scopeActive.
- Quota sync: PlanService@syncAiQuota on subscribe/upgrade.
- Tests: SubscriptionExpiryTest, SubscriptionMigrationTest, SubscriptionUniquenessTest, PlansTest.

## 5. Agency assignment workflow

```
requested → admin_approved → agency_approved → completed
     │            │                │
     └── cancelled (owner/admin)   └── agency_declined
```

| State | Who triggers |
|---|---|
| requested | Customer (`AgencyRequestController`) |
| admin_approved | Admin (AdminAgencyController/admin approve) |
| agency_approved | Agency (AgencyAssignmentController@approve) |
| agency_declined | Agency decline |
| completed | Agency/customer completion (buildTripForCustomer → trip created) |
| cancelled | Cancel path |

- Enum: `AgencyAssignmentStatus`. Column: `agency_assignments.status`; events AgencyAssignmentAdminApproved/Approved/Declined; pagination 15/page.
- Enforcement: transition guards (illegal transitions rejected).
- Tests: AgencyTest, AgencyAssignmentStateTransitionTest, AgencyAssignmentCompletionTest, AdminAgencyPaginationTest.

## 6. Review workflow (moderation)

```
pending → approved
   │
   └──→ rejected
```

- Enum: `ReviewStatus` (pending/approved/rejected). Column: `reviews.status`.
- Submit = PENDING always (`InteractionController@storeReview` / ReviewController@store). Admin approve/reject (`AdminReviewController`), soft delete + restore.
- Tests: AdminRestoreTest, TripAccessControlTest.

## 7. Flag workflow (moderation)

```
pending → approved
   │
   └──→ declined
```

- Enum: `FlagStatus`. Column: `flags.status`; reviewed_at/reviewed_by set on review.
- Who: users report (StoreFlagRequest: complaint/suggestion, flagged_user_id, entity type/id, reason ≤128, details ≤4096); admin reviews via FlagService@approve/decline.
- Tests: AgencyTest (flag report/review).

## 8. Contact message workflow

```
unread → read → resolved
```

- Enum: `ContactMessageStatus`. Column: `contact_messages.status`. Admin marks read/resolved.
- Tests: ContactAndSettingsTest.

## 9. Experience workflow

```
pending → approved / rejected
```

- Enum: `ExperienceStatus` — enum exists; **no migration, no controller verified** → workflow not active (orphan domain).

## Notes

- State transitions are mostly **enforced at application level** (service guards) for agency/orders/payments; **enum-validated but not machine-enforced** for trip status (UpdateTripRequest allows `active` outside enum).
- No state-machine package (no spatie/laravel-model-states etc.) — transitions hand-written.
- Enum values reserved but unwired: OrderStatus.refunded, SubscriptionStatus.past_due/paused, FlightStatus.* (no flight workflow endpoints besides admin CRUD).