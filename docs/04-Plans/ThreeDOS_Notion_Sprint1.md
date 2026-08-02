# 🚀 ThreeDOS API Specification & Sprint 1 Plan

<callout icon="⏳" color="red_bg">
**SPRINT 1 DEADLINE:** Sunday 11:59 PM
All endpoints assigned below must be completed, tested, and pushed by the deadline.
</callout>

---

## 🏃‍♂️ Sprint 1 (Active)

### Module 1: User Identity & Access (Auth)
<span color="blue_bg">**Assignees:** Sara / Lojy</span>
*Secure authentication system, role-based access, and profile management.*

| # | Verb | Endpoint | Controller @ Action | PRD Feature |
|---|---|---|---|---|
| 1 | <span color="green">**GET/POST**</span> | `/register` | `Auth\RegisteredUserController` | User Registration |
| 2 | <span color="green">**GET/POST**</span> | `/login` | `Auth\AuthenticatedSessionController` | Login / Role-Based Access Setup |
| 3 | <span color="orange">**POST**</span> | `/logout` | `Auth\AuthenticatedSessionController@destroy` | Logout |
| 4 | <span color="green">**GET/POST**</span> | `/forgot-password` | `Auth\PasswordResetLinkController` | Forgot Password |
| 5 | <span color="green">**GET**</span> | `/verify-email` | `Auth\EmailVerificationPromptController` | Email Verification |
| 6 | <span color="green">**GET**</span> | `/profile` | `ProfileController@edit` | Profile Management |
| 7 | <span color="blue">**PATCH**</span> | `/profile` | `ProfileController@update` | Profile Management |

### Module 2: User Onboarding (Survey)
<span color="blue_bg">**Assignee:** Sama</span>
*Captures travel preferences immediately after registration to personalize the AI engine.*

| # | Verb | Endpoint | Controller @ Action | PRD Feature |
|---|---|---|---|---|
| 8 | <span color="green">**GET**</span> | `/onboarding` | `SurveyController@create` | Preferences: Travel Style, Budget, Interests |
| 9 | <span color="orange">**POST**</span> | `/onboarding` | `SurveyController@store` | Save Preferences |

### Module 3: Core Trip Planner
<span color="blue_bg">**Assignees:** Fady (First 3) / Adham (Last 2)</span>
*The main engine for creating trips and attaching specific bookings (hotels, flights).*

| # | Verb | Endpoint | Controller @ Action | PRD Feature |
|---|---|---|---|---|
| 10 | <span color="green">**GET**</span> | `/trips/create` | `TripController@create` | Select Destination, Days, Budget, Travelers |
| 11 | <span color="orange">**POST**</span> | `/trips` | `TripController@store` | Save basic Trip parameters |
| 12 | <span color="green">**GET**</span> | `/trips/{trip}` | `TripController@show` | View Daily Travel Itinerary & Expenses |
| 13 | <span color="orange">**POST**</span> | `/trips/{trip}/attach/{type}` | `BookingController@attach` | Attach Hotels / Restaurants / Attractions |
| 14 | <span color="red">**DELETE**</span> | `/trips/{trip}/detach/{id}` | `BookingController@detach` | Remove attached items |

### Module 4: Explore Directory (Public)
<span color="blue_bg">**Assignees:** Kenzy (First 4) / Hana (Last 4)</span>
*Public-facing routes to browse the seeded database of locations and places.*

| # | Verb | Endpoint | Controller @ Action | PRD Feature |
|---|---|---|---|---|
| 15 | <span color="green">**GET**</span> | `/destinations` | `DestinationController@index` | List all destinations + filters (AJAX) |
| 16 | <span color="green">**GET**</span> | `/destinations/{destination}` | `DestinationController@show` | Destination details + Leaflet map |
| 17 | <span color="green">**GET**</span> | `/hotels` | `HotelController@index` | List hotels + search & filter |
| 18 | <span color="green">**GET**</span> | `/hotels/{hotel}` | `HotelController@show` | Hotel details |
| 19 | <span color="green">**GET**</span> | `/restaurants` | `RestaurantController@index` | List restaurants + filter |
| 20 | <span color="green">**GET**</span> | `/restaurants/{restaurant}` | `RestaurantController@show` | Restaurant details |
| 21 | <span color="green">**GET**</span> | `/attractions` | `AttractionController@index` | List attractions + category filter |
| 22 | <span color="green">**GET**</span> | `/attractions/{attraction}` | `AttractionController@show` | Attraction details |

### Module 4.5: Categories
<span color="blue_bg">**Assignee:** Rana</span>
*Endpoints for fetching and managing travel categories.*

| # | Verb | Endpoint | Controller @ Action | PRD Feature |
|---|---|---|---|---|
| 23 | <span color="green">**GET**</span> | `/categories` | `CategoryController@index` | List categories as clickable cards |
| 24 | <span color="green">**GET**</span> | `/categories/{category}` | `CategoryController@show` | View everything in a specific category |
| 25 | <span color="gray">**CRUD**</span> | `/admin/categories` | `Admin\CategoryController@*` | Manage category definitions (Admin) |

### Module 5: User Interactions (Community)
<span color="blue_bg">**Assignee:** Tyson</span>
*Polymorphic actions allowing users to favourite and review any entity.*

| # | Verb | Endpoint | Controller @ Action | PRD Feature |
|---|---|---|---|---|
| 26 | <span color="orange">**POST**</span> | `/favourites/{type}/{id}` | `FavouriteController@toggle` | Add/Remove Favorite (Polymorphic) |
| 27 | <span color="orange">**POST**</span> | `/reviews/{type}/{id}` | `ReviewController@store` | Submit a review (saved as pending) |
| 28 | <span color="red">**DELETE**</span> | `/reviews/{review}` | `ReviewController@destroy` | Delete user review |

---

## 📅 Future Sprints (Backlog)
<callout icon="💡" color="gray_bg">
The following modules are scheduled for upcoming sprints. Details and assignments will be discussed later.
</callout>

*   **Module 6:** AI & External API Proxies (OpenAI, Weather)
*   **Module 7:** Interactive Maps (Leaflet Routing)
*   **Module 8:** User Dashboard (Statistics, Saved Lists)
*   **Module 9:** Admin Dashboard (Moderation, CRM, Contact Inbox, User Blocking)

---

## 🚧 Missing / Planned Endpoints (To Be Added Later)
<callout icon="⚠️" color="yellow_bg">
The following features were identified but are **NOT** part of the current ERD or scope. We will design and add these endpoints later when the business logic is finalized.
</callout>

| Feature | Notes |
|---|---|
| **Reports** | To generate PDF/CSV exports for Admin Analytics (Revenue, User Growth). |
| **Payment Gateway** | For processing live bookings (Stripe / PayPal integration). |
| **Transactions** | To record payment history, refunds, and booking receipts. |