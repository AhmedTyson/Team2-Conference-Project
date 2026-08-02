# ThreeDOS Master GitHub Project Management & Phase Plan (A to Z)

## Executive Summary
This document is the authoritative project management master plan for the ThreeDOS Smart AI Travel Planner. It dictates the exact structure of the GitHub Projects Kanban board and provides an exhaustive, A-to-Z roadmap of all development phases up to the August 9th deadline. 

Crucially, **Sprint 1** (our current active sprint) has been completely broken down into **28 individual Task Cards**. Every single task card maps precisely to an API endpoint and is strictly assigned to the designated team member (Sara, Lojy, Sama, Fady, Adham, Kenzy, Hana, Rana, Tyson). 

**Future Sprints (2 through 6)** are outlined purely as technical phases without team assignments, ensuring we focus strictly on the current sprint's roles while maintaining a clear vision of the upcoming architectural hurdles (Shadow Modeling, AI Generation, QA).

---

## Part 1: GitHub Projects Board Configuration

To manage these 28 task cards effectively, the GitHub Project must be configured with the following parameters:

### 1.1 Custom Fields
*   **Status (Single Select):** `Backlog`, `Ready for Dev`, `In Progress`, `In Code Review`, `QA Testing`, `Done`.
*   **Sprint (Iteration):** `Sprint 1`, `Sprint 2`, `Sprint 3`, `Sprint 4`, `Sprint 5`, `Sprint 6`.
*   **Module (Single Select):** `Auth`, `Onboarding`, `Trips`, `Explore`, `Categories`, `Community`, `Admin`.
*   **Assignee:** Linked to team members.

### 1.2 Required Views (Tabs)
1.  **Active Sprint Board (Kanban):** Grouped by Status. Filtered by `Sprint: Sprint 1`.
2.  **Team Workload (Kanban):** Grouped by Assignee. Shows exactly what Sara, Fady, Rana, etc., are currently working on.
3.  **Module Matrix (Table):** Grouped by Module. Provides a top-down view of API completion.

---

## Part 2: Sprint 1 - Individual Task Cards (Active)

The following 28 task cards must be created in GitHub. Developers must claim their assigned cards, move them to `In Progress`, and link their Pull Requests to them.

### 1.1 Auth Module (Assignees: SARA / LOJY)

**Task Card 1: `[Auth] User Registration`**
*   **Route:** `POST /api/v1/auth/register`
*   **Assignee:** SARA / LOJY
*   **Authorize:** 🌐 Public
*   **Description:** Handle new user registration.
*   **Acceptance Criteria:**
    *   Create `RegisterRequest` to validate: `name` (string, required), `email` (email, required, unique), `password` (string, required, min 8, confirmed).
    *   Hash the password using `Hash::make`.
    *   Create the User record in the database.
    *   Assign the default `user` role using Spatie (`$user->assignRole('user')`).
    *   Generate a JWT token using `auth('api')->login($user)`.
    *   Return a standardized JSON response containing the user object and the Bearer token.

**Task Card 2: `[Auth] User Login`**
*   **Route:** `POST /api/v1/auth/login`
*   **Assignee:** SARA / LOJY
*   **Authorize:** 🌐 Public
*   **Description:** Authenticate existing users and setup role-based access.
*   **Acceptance Criteria:**
    *   Create `LoginRequest` to validate email and password.
    *   Attempt authentication using `auth('api')->attempt($credentials)`.
    *   If failed, return `401 Unauthorized` with an error message.
    *   If successful, return `200 OK` with the JWT Bearer token and the user's data (including their Spatie roles).

**Task Card 3: `[Auth] Invalidate Session Token`**
*   **Route:** `POST /api/v1/auth/logout`
*   **Assignee:** SARA / LOJY
*   **Authorize:** 🔒 Auth
*   **Description:** Securely log the user out by invalidating their JWT.
*   **Acceptance Criteria:**
    *   Ensure the route is protected by `auth:api` middleware.
    *   Call `auth('api')->logout()`.
    *   Return a `200 OK` JSON response confirming logout.

**Task Card 4: `[Auth] Request Password Reset`**
*   **Route:** `POST /api/v1/auth/forgot-password`
*   **Assignee:** SARA / LOJY
*   **Authorize:** 🌐 Public
*   **Description:** Initiate the password reset flow.
*   **Acceptance Criteria:**
    *   Validate the email exists in the `users` table.
    *   Generate a secure reset token.
    *   (Optional for Sprint 1) Mock the email sending or use Laravel's default `Password::sendResetLink()`.
    *   Return a `200 OK` response.

**Task Card 5: `[Auth] Verify Email`**
*   **Route:** `POST /api/v1/auth/verify-email`
*   **Assignee:** SARA / LOJY
*   **Authorize:** 🔒 Auth
*   **Description:** Process the email verification link.
*   **Acceptance Criteria:**
    *   Validate the verification hash against the authenticated user.
    *   Update the `email_verified_at` timestamp.
    *   Return a success message.

**Task Card 6: `[Profile] Fetch Profile Data`**
*   **Route:** `GET /api/v1/profile`
*   **Assignee:** SARA / LOJY
*   **Authorize:** 👤 Owner
*   **Description:** Retrieve the authenticated user's profile information.
*   **Acceptance Criteria:**
    *   Route protected by `auth:api`.
    *   Return the `$request->user()` data, wrapped in a `UserResource` to hide sensitive fields (like password and remember_token).

**Task Card 7: `[Profile] Update Profile Data`**
*   **Route:** `PATCH /api/v1/profile`
*   **Assignee:** SARA / LOJY
*   **Authorize:** 👤 Owner
*   **Description:** Allow the user to update their name, profile image, or password.
*   **Acceptance Criteria:**
    *   Create `UpdateProfileRequest` with sometimes/nullable validation rules.
    *   If a new password is provided, hash it before saving.
    *   Return the updated `UserResource`.

---

### 1.2 User Onboarding (Survey) (Assignee: SAMA)

**Task Card 8: `[Onboarding] Get User Preferences`**
*   **Route:** `GET /api/v1/onboarding`
*   **Assignee:** SAMA
*   **Authorize:** 👤 Owner
*   **Description:** Retrieve the user's previously saved travel preferences.
*   **Acceptance Criteria:**
    *   Query the `surveys` table for a record matching `$request->user()->id`.
    *   If no survey exists, return a `404` or an empty default object.
    *   Wrap response in a `SurveyResource`.

**Task Card 9: `[Onboarding] Save Travel Style & Budget`**
*   **Route:** `POST /api/v1/onboarding`
*   **Assignee:** SAMA
*   **Authorize:** 👤 Owner
*   **Description:** Save or update the user's travel style, budget, and interests for the AI engine.
*   **Acceptance Criteria:**
    *   Create `StoreSurveyRequest` to validate budget arrays, travel styles, and preferred climates.
    *   Use `updateOrCreate` on the `surveys` table matching the `user_id`.
    *   Return `201 Created` or `200 OK` with the saved data.

---

### 1.3 Trip Planner Engine (Assignees: FADY, ADHAM)

**Task Card 10: `[Trips] Serve Creation Data`**
*   **Route:** `GET /api/v1/trips/create`
*   **Assignee:** FADY
*   **Authorize:** 🔒 Auth
*   **Description:** Provide the frontend with the necessary dropdown data to create a trip.
*   **Acceptance Criteria:**
    *   Return a minimal list of available Destinations (ID and Name).
    *   Return acceptable budget tiers and day limits.

**Task Card 11: `[Trips] Save Basic Trip Parameters`**
*   **Route:** `POST /api/v1/trips`
*   **Assignee:** FADY
*   **Authorize:** 🔒 Auth
*   **Description:** Create the initial shell of a Trip in the database.
*   **Acceptance Criteria:**
    *   Create `StoreTripRequest` to validate `destination_id`, `start_date`, `end_date`, `budget`.
    *   Create a record in the `trips` table linked to the authenticated user.
    *   Return the new Trip ID.

**Task Card 12: `[Trips] View Daily Itinerary`**
*   **Route:** `GET /api/v1/trips/{trip}`
*   **Assignee:** FADY
*   **Authorize:** 👤 Owner
*   **Description:** Fetch a specific trip and its associated daily itinerary items.
*   **Acceptance Criteria:**
    *   Ensure the authenticated user owns the trip (use a Policy or `where('user_id')`).
    *   Eager load the `itinerary_items` relationship.
    *   Format the response using a `TripResource` that nests the daily items.

**Task Card 13: `[Trips] Attach Hotels / Restaurants`**
*   **Route:** `POST /api/v1/trips/{trip}/attach/{type}`
*   **Assignee:** ADHAM
*   **Authorize:** 👤 Owner
*   **Description:** Manually add a specific hotel or restaurant to a trip's itinerary.
*   **Acceptance Criteria:**
    *   Validate `{type}` is a valid attachable entity (e.g., 'hotel', 'restaurant').
    *   Validate the provided `item_id` in the request body.
    *   Create a record in the appropriate pivot table (`hotel_trip`, `restaurant_trip`) or `itinerary_items`.
    *   Return a success message.

**Task Card 14: `[Trips] Remove Attached Items`**
*   **Route:** `DELETE /api/v1/trips/{trip}/detach/{id}`
*   **Assignee:** ADHAM
*   **Authorize:** 👤 Owner
*   **Description:** Remove an item from the itinerary.
*   **Acceptance Criteria:**
    *   Verify ownership of the trip.
    *   Remove the specified itinerary item or pivot record.
    *   Return a `200 OK` success message.

---

### 1.4 Explore Directory (Assignees: KENZY, HANA)

**Task Card 15: `[Explore] List All Destinations`**
*   **Route:** `GET /api/v1/destinations`
*   **Assignee:** KENZY
*   **Authorize:** 🌐 Public
*   **Description:** Fetch a paginated list of destinations.
*   **Acceptance Criteria:**
    *   Query the `destinations` table.
    *   Implement basic filtering (e.g., by country or region if applicable).
    *   Return a paginated `DestinationResource` collection.

**Task Card 16: `[Explore] Destination Details & Map`**
*   **Route:** `GET /api/v1/destinations/{id}`
*   **Assignee:** KENZY
*   **Authorize:** 🌐 Public
*   **Description:** Fetch a single destination with full details.
*   **Acceptance Criteria:**
    *   Retrieve destination by ID.
    *   Ensure latitude/longitude data is exposed in the resource for Leaflet map integration on the frontend.
    *   Return a `404` if not found.

**Task Card 17: `[Explore] List Hotels`**
*   **Route:** `GET /api/v1/hotels`
*   **Assignee:** KENZY
*   **Authorize:** 🌐 Public
*   **Description:** Fetch a list of hotels.
*   **Acceptance Criteria:**
    *   Query the `hotels` table.
    *   Implement pagination.
    *   Return a `HotelResource` collection.

**Task Card 18: `[Explore] Hotel Details`**
*   **Route:** `GET /api/v1/hotels/{id}`
*   **Assignee:** KENZY
*   **Authorize:** 🌐 Public
*   **Description:** Fetch details for a specific hotel.
*   **Acceptance Criteria:**
    *   Retrieve hotel by ID.
    *   Include associated destination data if eager loaded.

**Task Card 19: `[Explore] List Restaurants`**
*   **Route:** `GET /api/v1/restaurants`
*   **Assignee:** HANA
*   **Authorize:** 🌐 Public
*   **Description:** Fetch a paginated list of restaurants.
*   **Acceptance Criteria:**
    *   Query the `restaurants` table.
    *   Return a paginated `RestaurantResource` collection.

**Task Card 20: `[Explore] Restaurant Details`**
*   **Route:** `GET /api/v1/restaurants/{id}`
*   **Assignee:** HANA
*   **Authorize:** 🌐 Public
*   **Description:** Fetch details for a specific restaurant.
*   **Acceptance Criteria:**
    *   Retrieve restaurant by ID.
    *   Return a single `RestaurantResource`.

**Task Card 21: `[Explore] List Attractions`**
*   **Route:** `GET /api/v1/attractions`
*   **Assignee:** HANA
*   **Authorize:** 🌐 Public
*   **Description:** Fetch a paginated list of attractions.
*   **Acceptance Criteria:**
    *   Query the `attractions` table.
    *   Return an `AttractionResource` collection.

**Task Card 22: `[Explore] Attraction Details`**
*   **Route:** `GET /api/v1/attractions/{id}`
*   **Assignee:** HANA
*   **Authorize:** 🌐 Public
*   **Description:** Fetch details for a specific attraction.
*   **Acceptance Criteria:**
    *   Retrieve attraction by ID.
    *   Return a single `AttractionResource`.

---

### 1.5 Categories Module (Assignee: RANA)

**Task Card 23: `[Categories] List Categories as Cards`**
*   **Route:** `GET /api/v1/categories`
*   **Assignee:** RANA
*   **Authorize:** 🌐 Public
*   **Description:** Provide category data for the frontend UI cards.
*   **Acceptance Criteria:**
    *   Fetch all active categories from the `categories` table.
    *   Format using `CategoryResource` (include ID, name, icon/image).

**Task Card 24: `[Categories] View Category Contents`**
*   **Route:** `GET /api/v1/categories/{id}`
*   **Assignee:** RANA
*   **Authorize:** 🌐 Public
*   **Description:** Fetch a specific category and its associated items.
*   **Acceptance Criteria:**
    *   Fetch category by ID.
    *   Eager load the related attractions or entities linked to this category.

---

### 1.15 Admin Categories (Assignee: RANA)

**Task Card 25: `[Admin] Manage Categories`**
*   **Route:** `GET/POST/PUT /api/v1/admin/categories`
*   **Assignee:** RANA
*   **Authorize:** 🛡️ Admin
*   **Description:** CRUD operations for administrators to define new categories (e.g., Beaches, Mountains).
*   **Acceptance Criteria:**
    *   Protect route with `auth:api` and Spatie middleware ensuring the user has the `admin` or `super_admin` role.
    *   Implement standard resource methods (index, store, update, destroy) using Form Requests for validation.

---

### 1.6 User Interactions / Community (Assignee: TYSON)

**Task Card 26: `[Community] Add/Remove Favorite`**
*   **Route:** `POST /api/v1/favourites/{type}/{id}`
*   **Assignee:** TYSON
*   **Authorize:** 🔒 Auth
*   **Description:** Toggle a polymorphic favorite for the authenticated user.
*   **Acceptance Criteria:**
    *   Validate `{type}` (e.g., 'hotel', 'restaurant', 'destination').
    *   Check if a record exists in the `favourites` table for this user and morph type/id.
    *   If it exists, delete it (un-favorite). If it doesn't, create it (favorite).
    *   Return a JSON response indicating the new state.

**Task Card 27: `[Community] Submit a Review`**
*   **Route:** `POST /api/v1/reviews/{type}/{id}`
*   **Assignee:** TYSON
*   **Authorize:** 🔒 Auth
*   **Description:** Submit a review for a specific entity, marked as pending.
*   **Acceptance Criteria:**
    *   Create `StoreReviewRequest` validating `rating` (integer 1-5) and `comment` (string).
    *   Create a new record in the `reviews` table using the polymorphic relations.
    *   Set the default `status` column to `pending`.
    *   Return a `201 Created` response.

**Task Card 28: `[Community] Delete User Review`**
*   **Route:** `DELETE /api/v1/reviews/{id}`
*   **Assignee:** TYSON
*   **Authorize:** 👤 Owner
*   **Description:** Allow a user to delete their own review.
*   **Acceptance Criteria:**
    *   Find the review by ID.
    *   Ensure `$review->user_id === auth()->id()`. Return `403 Forbidden` if not.
    *   Delete the record and return a success message.

---

## Part 3: Future Phases Roadmap (A to Z Architecture)

*Note: Sprints 2 through 6 dictate the technical progression of the application. Roles are not assigned here; tasks will be distributed dynamically based on Sprint 1 velocity.*

### Phase B: External API Architecture & Shadow Modeling (Sprint 2)
*   **Challenge:** Standard Laravel polymorphic relations (Favorites/Reviews) require local database IDs. How do we favorite a Hotel that exists only on RapidAPI?
*   **The Shadow Model Solution:** We will build robust HTTP Clients (`RapidApiHotelClient`, `OpenFlightsClient`). When a user interacts with an external ID, the backend will dynamically fetch it, save a localized "Shadow" copy into our database, and link the favorite/review to that local copy. This prevents N+1 external API calls and ensures incredible read speeds.
*   **Data Fixtures Sync:** Implement a background command (`FixturesSyncCommand`) that routinely updates our local fallback JSON files, ensuring the application functions flawlessly even if external APIs experience downtime.

### Phase C: The AI Engine & Itinerary Generation (Sprint 3)
*   **AI Integration:** Construct the `OpenAiClient`. We will design a secure prompt template that injects the user's `Survey` data (budget, travel style) alongside their chosen destination.
*   **JSON Schema Enforcement:** The AI prompt will strictly enforce a JSON output schema.
*   **Itinerary Stitching:** As the AI returns suggestions, the backend will iterate through them, resolve the Shadow Models via the External APIs, and construct daily `itinerary_items` tied to the user's `Trip`.

### Phase D: Admin Reporting & Payments Scaffolding (Sprint 4)
*   **Reporting Export:** Implement `DOMPDF` and `Laravel Excel` to generate revenue, user growth, and destination popularity reports for the Admin dashboard.
*   **Payments Webhooks:** Scaffold the `Stripe/PayPal` webhook controllers to handle asynchronous payment confirmations, securing them with gateway signature validation.

### Phase E: Hardening, Security, & Optimization (Sprint 5)
*   **Query Optimization:** Utilize Laravel Telescope to hunt down N+1 queries. We will inject Eloquent Eager Loading (`with()`) into all API Resources to minimize database connections.
*   **API Rate Limiting:** Implement strict `throttle:api` parameters to protect the expensive AI generation routes from abuse.
*   **Test Driven QA:** Ensure 100% passing rate on automated Feature Tests for the core Auth, Trip Generation, and Interaction workflows.

### Phase Z: Launch & Handoff (Sprint 6)
*   **Production Deployment:** Transition `.env` to `production` mode, disabling debug bars. Cache configurations (`php artisan config:cache`, `route:cache`).
*   **Postman Synchronization:** Export the final, comprehensive Postman Collection containing all 59 endpoints, fully documented with example responses, and commit it to `docs/updated_docs/Postman_ThreeDOS.json` for evaluator handoff.



---

## Part 5: Sprint Transition & Git Workflow Protocol

To maintain repository hygiene and prevent data loss, the transition from one Sprint to the next follows a strict protocol.

### 5.1 End-of-Sprint Checklist
When the deadline for a Sprint is reached (e.g., Sprint 1 ends Aug 2 at 12:00 PM):
1. **Status Update:** The Scrum Master updates all completed GitHub Task Cards in the current sprint to Done.
2. **Final Sync:** All approved Pull Requests must be merged into main.
3. **Main Lock:** Developers must stop pushing to their current sprint branches.

### 5.2 Branch Cleanup (ADMIN ONLY)
> **CRITICAL RULE:** Developers must NEVER delete branches locally or remotely.

Branch cleanup is strictly an **Admin-Only** operation. Once the sprint is verified and successfully merged into main:
1. The Repository Administrator will safely archive/delete the old sprint branches (e.g., Rana, Sama, Sarah) from the remote repository.
2. This ensures a clean slate for the new sprint and prevents developers from accidentally pushing Sprint 2 code to Sprint 1 branches.

### 5.3 Kicking off the Next Sprint (The dev/ Prefix)
To clearly distinguish active work from legacy work, every new Sprint will utilize a new branch prefix. 

For Sprint 2 and beyond, developers will branch out from the updated main branch using the dev/ prefix:

1. Pull the latest approved code:
   git checkout main
   git pull origin main

2. Create the new Sprint branch:
   git checkout -b dev/rana

3. Publish the branch to GitHub:
   git push -u origin dev/rana

By enforcing the dev/ prefix for Sprint 2, the Admin can easily track which branches belong to the current development cycle versus any lingering branches from previous phases.
