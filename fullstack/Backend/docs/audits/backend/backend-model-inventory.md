# Backend — Model Inventory

36 Eloquent models. Grouped by domain. `SOFT` = soft-deletes.

## Account (3)

| Model | Table | Purpose | Relationships | Casts | Notes |
|---|---|---|---|---|---|
| User (`Account\User`) | users | Auth principal | hasOne survey; hasMany notifications/trips/favourites/reviews/subscriptions | hashed(password), is_active bool, ai_generations_count int | JWTSubject; HasRoles guard `api`; no soft deletes |
| Role (`Account\Role`) | roles | Spatie role override | spatie relations | — | Fills `locked` name/guard_name; guard api |
| UserPoint | user_points | Gamification points | belongsTo user | metadata json | (user_id, action) index |

## Catalog (10)

| Model | Table | Purpose | Relationships | Casts | Notes |
|---|---|---|---|---|---|
| Country | countries | Geo reference | hasMany destinations | languages array | SOFT |
| Destination | destinations | City/destination | belongsTo country+category; hasMany hotels/attractions/restaurants/tripDestinations; morphMany favourites+reviews; belongsToMany trips (pivot day_number/visit_order/estimated_date/notes) | — | SOFT; lat/lng decimal(10,7); **model file has morphMap-compatible class** |
| Category | categories | Resource taxonomy | hasMany destinations/attractions/restaurants | — | SOFT; name/type |
| Hotel | hotels | Lodging | belongsTo destination; morphMany reviews/itineraryItems/favourites | availability bool | SOFT |
| Restaurant | restaurants | Dining | belongsTo destination+category; morphMany reviews/itineraryItems/favourites | — | SOFT |
| Attraction | attractions | POIs | belongsTo destination+category; morphMany reviews/itineraryItems/favourites | — | SOFT; lat/lng decimal(10,7) |
| Flight | flights | Air travel | morphMany itineraryItems/favourites/reviews | — | SOFT; departure/arrival airports+dates |
| Experience | experiences | Provider experiences | belongsTo provider(User)+destination; morphOne address; morphMany views | eco_score | **No matching migration — UNUSED** |
| ExperienceProvider | (none) | Provider profile concept | — | — | **No migration — UNUSED** |
| EntityView | (none) | View tracking | morphMany | — | **No migration — UNUSED** |

## Trips (8)

| Model | Table | Purpose | Relationships | Casts | Notes |
|---|---|---|---|---|---|
| Trip | trips | Core trip entity | belongsTo user/parentTrip/originalTrip; hasMany forks/tripDestinations/itineraryItems/aiRecommendations; belongsToMany destinations; morphedByMany flights/hotels/attractions/restaurants (trip_items) | interests array; status→TripStatus; many bools (is_fork/is_public) | SOFT; fork lineage fields (parent_trip_id/original_trip_id/source_version_id) |
| TripDestination | trip_destinations | Trip↔destination w/ day info | belongsTo trip+destination | — | Pivot w/ extra columns |
| ItineraryItem | itinerary_items | Ordered trip items | belongsTo trip; morphTo itemable | — | day_number/item_order/time_slot/type |
| Review | reviews | Ratings/comments | belongsTo user; morphTo reviewable | status→ReviewStatus | SOFT |
| Favourite | favourites | Saved items | belongsTo user; morphTo favorable | — | No soft delete |
| AiRecommendation | ai_recommendations | AI I/O history | belongsTo trip | — | prompt/response/model/tokens |
| BudgetSnapshot | budget_snapshots | Budget tracking | belongsTo trip | breakdown json | — |
| TripContribution | trip_contributions | Contributor funding | belongsTo trip | — | — |

## Commerce (8)

| Model | Table | Purpose | Relationships | Casts | Notes |
|---|---|---|---|---|---|
| Order | orders | Checkout order | belongsTo user; hasMany items/payments | status→OrderStatus; expires_at datetime | idempotency_key unique; confirmation_code unique 8-char |
| OrderItem | order_items | Order line items | belongsTo order; morphTo product | metadata json | — |
| Payment | payments | Payment records | belongsTo order; booking()→**absent Booking model** | status→PaymentStatus; raw_payload encrypted:array; hmac_valid bool | Append-only (UPDATED_AT=null); no PAN columns |
| Plan | plans | Subscription tiers | hasMany subscriptions | billing_cycle→BillingCycle; features array; price_cents/ai_quota_monthly int | is_active bool |
| Subscription | subscriptions | Active subscriptions | belongsTo user+plan | status→SubscriptionStatus; renews_at datetime | Partial unique on active user; scopeActive |
| AgencyAssignment | agency_assignments | Agency task | belongsTo customer/agency/admin (User); hasMany trips | status→AgencyAssignmentStatus | — |
| Address | addresses | Morph addresses | morphTo addressable | — | — |
| Company | (none) | Company record | — | — | **No migration — UNUSED** |

## System (8)

| Model | Table | Purpose | Relationships | Casts | Notes |
|---|---|---|---|---|---|
| ContactMessage | contact_messages | Contact form | — | status→ContactMessageStatus | — |
| Survey | surveys | Preferences survey | belongsTo user | interests array; budget_level→BudgetLevel | SOFT |
| Flag | flags | Moderation reports | belongsTo reporter/reviewer/agencyAssignment; morphTo flaggable | status→FlagStatus | — |
| Setting | settings | Site configuration | — | SITE_KEYS whitelist; public-cache methods | key/value text |
| Report | reports | Generated reports | belongsTo user | appends file_url (public disk) | status/format |
| Notification | notifications | DB notifications | morphTo notifiable | data json; status→NotificationStatus | uuid id |
| PasswordResetToken | password_reset_tokens | Password reset | — | — | — |
| (UserPoint/Survey/etc. shared) | — | — | — | — | — |

## Noteworthy model facts

- **Models without tables (orphans)**: `Experience`, `ExperienceProvider`, `EntityView`, `Company` — no migrations exist; Dead/legacy code, not active functionality.
- **Dead relation**: `Payment::booking()` → `Booking` class absent.
- **Morph map** (enforced): user, hotel, restaurant, attraction, destination, flight, trip, plan → `Relation::enforceMorphMap` in AppServiceProvider.
- **Soft-delete tables (10)**: surveys, countries, categories, destinations, restaurants, trips, flights, hotels, attractions, reviews.
- **No observers/global scopes found** beyond Trip `scopeActive` equivalent on Subscription + Setting cache helpers.