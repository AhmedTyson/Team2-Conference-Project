# Business Decision Register

Date: 2026-08-11
Purpose: record product/ops decisions that BLOCK implementation phases. Resolved rows below were confirmed by product owner (Ahmed) on 2026-08-11. Remaining rows are open questions with options.

Status vocabulary: OPEN (blocks implementation) / RESOLVED (record decision + date + owner).

---

## Decision Register

| Decision | Current Behavior | Options | Chosen Option | Why | Blocks |
|---|---|---|---|---|---|
| D1 — Trip fork visibility/ownership | Any authenticated user can fork ANY trip (paid, via checkout); fulfillment copies full trip incl. private content; no visibility concept exists | A) Owner-only; B) Public trips forkable (add is_public flag); C) Shared-via-agency | **B — Public trips forkable (`is_public` flag)** | Product wants shareable trips. Fork gate: fork allowed iff trip.is_public OR buyer owns trip; private trips stay owner-only. Ship as migration `trips.is_public` (default false) + policy/guard reuse | SEC-04, fork tests, S-EXT-2 |
| D2 — Subscription model semantics | One-time Paymob purchase → Subscription status=active, renews_at set but NEVER enforced; quota resets monthly forever; cancel = status flip only | A) True recurring (Paymob recurring + renewal job + dunning); B) Lifetime access; C) Fixed-term quota pack — expire at renews_at, re-purchase to extend; D) keep current | **C — Fixed-term quota pack** | Owner confirmed. One payment = one term (renews_at = expires_at, e.g. 1 month/1 year). Scheduler job expires subs past renews_at → status=expired, quota gated. Re-purchase creates fresh term. No gateway recurring integration, predictable revenue, honest UI | SEC-10, DB-02 (constraint shape), quota logic, S-EXT-1 |
| D3 — Map destination write semantics | GET /api/v1/maps/destination/{id} backfills destination.lat/lng on the fly (side effect on GET, unauthenticated) | A) Queued backfill job (GET stays pure); B) keep GET side effect + auth it; C) precompute at import | **A — Queued backfill job** | GET stays idempotent/cachable; aligns with SEC-03 fix (throttle + auth); write happens in worker with proper validation | SEC-12, SEC-03 mitigation shape |
| D4 — Payment data retention | card_pan (unmasked string) + raw_payload (full webhook JSON) stored on payments; append-only model | A) Masked PAN only + drop payload; B) Encrypt raw_payload + retention purge; C) keep as-is | **B — Encrypt raw_payload + retention purge** | Keeps reconciliation data for HMAC dispute resolution; removes plaintext at-rest exposure. Implementation: Laravel `encrypted:array` cast on raw_payload, truncate/blank card_pan to last4 (mask), purge job deletes rows older than retention window (suggest 90 days) | SEC-05, payment regression tests, PCI posture |
| D5 — Pending order expiry window + auto-fulfillment | Pending orders live forever; webhooks fulfill regardless of age | Windows 15m/30m/60m/24h; late-webhook: reject vs grace; auto-fulfillment of purchased item on payment confirmation | **30m window + 24h grace, then reject; auto-success fulfillment on payment** | Owner confirmed. PLUS requirement: when payment is confirmed via webhook, the purchased item (trip fork / package access / subscription) is auto-fulfilled and order status auto-transitions (paid/completed) — no manual admin step. Verify existing FulfillOrderListener covers all product types end-to-end; add regression lock | SEC-09, Phase 2/3 scheduler job, fulfillment regression |
| D6 — Blocked-user token behavior | is_active=false does nothing to existing JWTs; blocked user can keep authenticating until token expiry (60m, refresh 14d) | A) Blacklist on block (immediate); B) middleware per-request; C) both | **C — Both** | Immediate kill at block time (JWT blacklist in AdminUserController::setBlock) + per-request guard closes refresh-window gap. ~10 lines total | SEC-01 implementation detail, admin UX |

---

## Resolution Log

| Decision | Status | Resolution | Date | Owner |
|---|---|---|---|---|
| D1 | RESOLVED | B — `is_public` flag; fork iff is_public OR owner; private stays owner-only | 2026-08-11 | Ahmed (product) |
| D2 | RESOLVED | C — Fixed-term quota pack; renews_at = expires_at; scheduler expires; re-purchase extends. **Confirmed as best/recommended option** (recorded 2026-08-11; A/B/D rejected: A too heavy w/ unverifiable Paymob recurring, B revenue leak, D perpetual free quota) | 2026-08-11 | Ahmed (product) |
| D3 | RESOLVED | A — Queued geocode backfill; GET stays pure | 2026-08-11 | Ahmed (product) |
| D4 | RESOLVED | B — Encrypt raw_payload + mask PAN (last4) + 90-day purge | 2026-08-11 | Ahmed (product) |
| D5 | RESOLVED | 30m expiry + 24h grace then reject; payment-confirmed → auto-fulfill item + auto status transition | 2026-08-11 | Ahmed (product) |
| D6 | RESOLVED | C — JWT blacklist on block + per-request middleware | 2026-08-11 | Ahmed (product) |

(All six decisions resolved — no implementation-blocking open decisions remain. Remediation phases 1-4 unblocked.)
