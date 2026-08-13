# Backend — Database Inventory

## Driver & setup

- Local dev: **sqlite** (`.env` DB_CONNECTION=sqlite; artisan about). Case-study target: MySQL. Migrations are driver-agnostic; partial-unique subscription index has sqlite/mysql variants.
- Migrations: **36 files**, all Ran (migrate:status verified; `migrate:fresh --seed` PASS on disposable local db).
- Factories: **NONE** (database/factories empty — 0 files).
- Seeders: **22**.

## Tables (36 migrations)

| Table | Key Columns | Notes |
|---|---|---|
| users | name,email,phone(20),email_verified_at,password,profile_image,is_active,ai_generations_count,ai_reset_at | +password_reset_tokens, sessions (same migration) |
| cache / cache_locks | standard | driver=database |
| jobs / job_batches / failed_jobs | standard | driver=database |
| telescope_entries / telescope_monitoring | dev tooling | TELESCOPE_ENABLED=false default |
| notifications | uuid id,title,type,notifiable morph,body,data json,status,read_at,user_id idx | custom DB notification |
| settings | key,value(text) | whitelisted SITE_KEYS |
| surveys | travel_style,budget_level,interests json | SOFT |
| countries | name,iso_code(3),capital,flag_url,currency(10),languages json | SOFT |
| categories | name,type,icon | SOFT |
| destinations | name,city_name,description,image,lat/lng decimal(10,7),country FK | SOFT |
| restaurants | name,cuisine,price_range,price_cents,rating decimal(2,1),address,image,destination+category FK | SOFT |
| trips | title,travel_style,interests json,no_of_travelers,budget,no_of_days,start/end date,status,estimated_cost,is_fork,is_public,parent/original trip FK,agency_assignment_id | SOFT |
| flights | airline,flight_number,departure/arrival_airport,departure/arrival_date datetime,price,booking_status | SOFT |
| trip_destinations | day_number,visit_order,estimated_date,notes,trip+destination idx | pivot w/ extras |
| favourites | note,favorable morph | morph |
| hotels | name,address,price_per_night,rating decimal(3,1),stars,availability,image,destination FK | SOFT |
| contact_messages | name,email,subject,message,status | — |
| itinerary_items | itemable morph,day_number,item_order,type,time_slot,title,notes,estimated_cost | morph |
| attractions | name,description,image,lat/lng decimal(10,7),destination+category FK | SOFT |
| ai_recommendations | prompt_text,response_text,generated_at,model_used,tokens_used | — |
| reviews | reviewable morph,rating tinyint,comment,status | SOFT |
| personal_access_tokens | tokenable morph,token(64),abilities,last_used_at,expires_at | sanctum; UNUSED |
| trip_items | item morph | morph |
| permission tables (4) | spatie standard | roles,permissions,model_has_*,role_has_permissions |
| addresses | addressable morph,line1/2,city,state,country,postal_code,lat/lng | morph |
| payments | paymob_transaction_id(100),status(30),amount_cents,currency(3),client_secret,checkout_url,hmac_valid,raw_payload,order FK | append-only; encrypted payload |
| budget_snapshots | total/spent/remaining_cents,breakdown json,recorded_at,trip FK | — |
| user_points | action(100),points,metadata json,user FK,(user_id,action) idx | — |
| trip_contributions | contributor_name,amount_cents,message,trip FK | — |
| plans | name,price_cents,currency(3),billing_cycle(10),ai_quota_monthly,features json,is_active | — |
| subscriptions | status default active,price_cents,currency,started_at,renews_at,provider(32),provider_ref,user+plan FK,idx(user_id,status),PARTIAL UNIQUE (sqlite/mysql) | one active per user |
| reports | from_date,to_date,format(10),file_path,status,user FK | public disk URL |
| orders | status default pending,total_cents,currency(3),idempotency_key unique nullable,expires_at,confirmation_code(8) unique,user FK,idx(user_id,status),(user_id,idempotency_key) | — |
| order_items | product morph,price_cents,metadata json,order FK | morph |
| agency_assignments | budget_level,status,admin_approved_at,agency_responded_at,customer/agency/admin FKs | — |
| flags | flaggable morph,reason,details,status,reviewed_at,reporter/reviewer/assignment FKs | morph |

## Constraints / Indexes of note

- Unique: orders.idempotency_key, orders.confirmation_code, subscriptions partial-unique-active, (user_points user_id,action).
- Morph tables: favourites, itinerary_items, reviews, trip_items, addresses, order_items, flags, notifications, personal_access_tokens.
- Soft-delete (deleted_at) on 10 tables: surveys, countries, categories, destinations, restaurants, trips, flights, hotels, attractions, reviews.

## Enum-backed columns (PHP enums)

| Column | Enum | Cases |
|---|---|---|
| trips.status | TripStatus | pending,planning,booked,completed,cancelled |
| reviews.status | ReviewStatus | pending,approved,rejected |
| orders.status | OrderStatus | pending,paid,fulfilled,failed,cancelled,refunded,expired |
| payments.status | PaymentStatus | pending,processing,paid,failed,cancelled,refunded |
| subscriptions.status | SubscriptionStatus | pending,active,past_due,cancelled,expired,paused |
| agency_assignments.status | AgencyAssignmentStatus | requested,admin_approved,agency_approved,agency_declined,completed,cancelled |
| flags.status | FlagStatus | pending,approved,declined |
| contact_messages.status | ContactMessageStatus | unread,read,resolved |
| notifications.status | NotificationStatus | read,unread |
| surveys.budget_level | BudgetLevel | low,medium,high,luxury |
| plans.billing_cycle | BillingCycle | monthly,yearly |
| flights.booking_status | FlightStatus | pending,confirmed,cancelled |
| experiences.status | ExperienceStatus | pending,approved,rejected (**no experiences table — orphan enum**) |

## Seeders (22)

Address, AgencyAssignment, Attraction, BudgetSnapshot, Category, Country, Database (aggregator), Destination, Favourite, Flight, Hotel, ItineraryItem, Notification, Payment, Plan, Restaurant, Review, RoleAndPermission, Settings, TripContribution, Trip, UserPoint.

## Findings

1. **No factories** — tests build models manually; seeders carry data responsibilities (incl. real cities via Wikidata-backed sync).
2. `flights` table uses `booking_status` (FlightStatus enum) but no admin flight-status workflow endpoint verified.
3. `personal_access_tokens` + telescope tables are infra noise in default migration set.
4. Orphan models (Experience/ExperienceProvider/EntityView/Company) have no tables — DB has no evidence for them.
5. `cities` table absent (case-study list) — city data lives on destinations.city_name.