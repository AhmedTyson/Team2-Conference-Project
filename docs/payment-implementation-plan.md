# Payment Implementation Plan

## Phase 1 — Domain & Database Foundation
**Goal**: Establish the generic commercial abstractions.
- Create `Order` and `OrderItem` models and migrations.
- Make `Payment` model polymorphic or relate it to `Order` instead of `Booking`.
- Add `parent_trip_id`, `original_trip_id`, and `is_fork` to `trips` table.
- Create Enums for `OrderStatus`, `PaymentStatus`, and `SubscriptionStatus`.

## Phase 2 — Pricing & Commercial Rules
**Goal**: Enforce backend-controlled pricing across all products (Digital SaaS + Physical Travel Packages).
- Implement a dual-track `PriceCalculatorService` to dictate amounts for any checkout request:
  - `calculateForkPrice`: Fetches fixed price from `Settings` for copying itinerary data.
  - `calculatePackagePrice`: Sums real-world costs of attached `BookingItem` elements (Hotels, Flights) and applies a platform commission to book an actual trip.
  - `calculateSubscriptionPrice`: Uses the `Plan` model as the absolute source of truth.

## Phase 3 — Payment Gateway Abstraction
**Goal**: Create a standard contract for payments.
- Define a `PaymentGatewayInterface` (`createIntention()`, `verifyWebhook()`).
- Refactor existing `PaymobController` logic into a `PaymobGateway` service class implementing this interface.

## Phase 4 — Paymob Integration
**Goal**: Secure, robust checkout flow.
- Update the checkout endpoint to create an `Order`, snapshot prices, and generate a Paymob Client Secret.
- Return the client secret to the frontend.
- Handle gateway error responses gracefully.

## Phase 5 — Webhooks & Idempotency
**Goal**: Reliable post-payment processing.
- Create `WebhookController` handling POST requests from Paymob.
- Implement strict HMAC validation.
- Enforce idempotency using atomic locks (e.g., `Cache::lock`) and UNIQUE DB constraints on `paymob_transaction_id`.
- Dispatch a `PaymentSucceeded` event.

## Phase 6 — Subscription Lifecycle
**Goal**: Tie subscription states to actual payments.
- Listen for `PaymentSucceeded`. If the order contains a subscription, update `Subscription` status to `active` and set `renews_at`.
- Refactor `PlanService` to remove the "stub" logic and enforce the payment requirement.
- Apply AI quota upon successful payment.

## Phase 7 — AI Trip Monetization
**Goal**: Usage limits and failure recovery.
- Enforce atomic updates when consuming AI quota (`DB::table('users')->where('id', $id)->where('ai_generations_count', '<', limit)->increment(...)`).
- Catch AI provider exceptions (e.g., OpenAI timeout) and restore the user's quota.

## Phase 8 — Paid Trip-Plan Forking
**Goal**: Deep-clone fulfillment for paid trip plans.
- Listen for `PaymentSucceeded` on fork orders.
- Implement `TripForkService` to deep-clone the `Trip`, `ItineraryItem`, and polymorphic relations (flights, hotels).
- Assign ownership of the new trip to the buyer, setting `parent_trip_id`.
- Mark the `Order` as `fulfilled`.

## Phase 9 — Checkout, Security & Testing
**Goal**: End-to-end verification.
- Write Feature Tests for webhooks, duplicate webhooks, and unauthorized access.
- Validate that the frontend cannot alter the price.
- Ensure private trips cannot be forked.

## Phase 10 — Production Readiness
**Goal**: Prepare for deployment.
- Document the required Paymob dashboard webhook configurations.
- Document all required `.env` variables (`PAYMOB_PUBLIC_KEY`, `PAYMOB_SECRET_KEY`, `PAYMOB_HMAC`, `PAYMOB_INTEGRATION_IDS`).
- Ensure no sensitive PII or card data is logged in the webhook payloads.
- Final code review against security best practices.
