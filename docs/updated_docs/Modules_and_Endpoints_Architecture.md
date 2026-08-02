# System Endpoints Architecture

This document maps all application endpoints directly to the required features outlined in the `Case_Study_For_ThreeDOS.md` PRD, separated logically into strictly scoped modules.

---

## Module 1: User Identity & Access
*Secure authentication system, role-based access, and profile management.*

| # | Verb | Endpoint | Controller @ Action | PRD Feature |
|---|---|---|---|---|
| 1 | **GET/POST** | `/register` | `Auth\RegisteredUserController` | User Registration |
| 2 | **GET/POST** | `/login` | `Auth\AuthenticatedSessionController` | Login / Role-Based Access Setup |
| 3 | **POST** | `/logout` | `Auth\AuthenticatedSessionController@destroy` | Logout |
| 4 | **GET/POST** | `/forgot-password` | `Auth\PasswordResetLinkController` | Forgot Password |
| 5 | **GET** | `/verify-email` | `Auth\EmailVerificationPromptController` | Email Verification |
| 6 | **GET** | `/profile` | `ProfileController@edit` | Profile Management |
| 7 | **PATCH** | `/profile` | `ProfileController@update` | Profile Management |

---

## Module 2: User Onboarding (Survey)
*Captures travel preferences immediately after registration to personalize the AI engine.*

| # | Verb | Endpoint | Controller @ Action | PRD Feature |
|---|---|---|---|---|
| 8 | **GET** | `/onboarding` | `SurveyController@create` | Preferences: Travel Style, Budget, Interests |
| 9 | **POST** | `/onboarding` | `SurveyController@store` | Save Preferences |

---

## Module 3: Core Trip Planner
*The main engine for creating trips and attaching specific bookings (hotels, flights).*

| # | Verb | Endpoint | Controller @ Action | PRD Feature |
|---|---|---|---|---|
| 10 | **GET** | `/trips/create` | `TripController@create` | Select Destination, Days, Budget, Travelers |
| 11 | **POST** | `/trips` | `TripController@store` | Save basic Trip parameters |
| 12 | **GET** | `/trips/{trip}` | `TripController@show` | View Daily Travel Itinerary & Expenses |
| 13 | **POST** | `/trips/{trip}/attach/{type}` | `BookingController@attach` | Attach Hotels / Restaurants / Attractions |
| 14 | **DELETE** | `/trips/{trip}/detach/{id}` | `BookingController@detach` | Remove attached items |

---

## Module 4: Explore Directory (Public)
*Public-facing routes to browse the seeded database of locations and places.*

| # | Verb | Endpoint | Controller @ Action | PRD Feature |
|---|---|---|---|---|
| 15 | **GET** | `/destinations` | `DestinationController@index` | List all destinations + filters (AJAX) |
| 16 | **GET** | `/destinations/{destination}` | `DestinationController@show` | Destination details + Leaflet map |
| 17 | **GET** | `/hotels` | `HotelController@index` | List hotels + search & filter |
| 18 | **GET** | `/hotels/{hotel}` | `HotelController@show` | Hotel details |
| 19 | **GET** | `/restaurants` | `RestaurantController@index` | List restaurants + filter |
| 20 | **GET** | `/restaurants/{restaurant}` | `RestaurantController@show` | Restaurant details |
| 21 | **GET** | `/attractions` | `AttractionController@index` | List attractions + category filter |
| 22 | **GET** | `/attractions/{attraction}` | `AttractionController@show` | Attraction details |

---

## Module 5: User Interactions (Community)
*Polymorphic actions allowing users to favourite and review any entity.*

| # | Verb | Endpoint | Controller @ Action | PRD Feature |
|---|---|---|---|---|
| 23 | **POST** | `/favourites/{type}/{id}` | `FavouriteController@toggle` | Add/Remove Favorite (Polymorphic) |
| 24 | **POST** | `/reviews/{type}/{id}` | `ReviewController@store` | Submit a review (saved as pending) |
| 25 | **DELETE** | `/reviews/{review}` | `ReviewController@destroy` | Delete user review |

---

## Module 6: AI & External API Proxies
*Endpoints and internal triggers managing external data flows.*

| # | Verb | Endpoint | Controller @ Action | PRD Feature |
|---|---|---|---|---|
| 26 | **CLI** | `php artisan db:seed` | `CountrySeeder::class` | Countries API: Fetch flags, currency, languages |
| 27 | **CLI** | `php artisan db:seed` | `HotelSeeder / FlightSeeder` | Hotels & Flights API: RapidAPI mock seeding |
| 28 | **GET** | `/api/weather/{city}` | `Api\WeatherController@show` | Weather API: Current weather, temp, wind (Cached) |
| 29 | **POST** | `/trips/{trip}/generate-ai` | `TripController@generateItinerary` | AI Recommendations: Trigger OpenAI API |

---

## Module 7: Interactive Maps
*Map endpoints feeding Leaflet.js / Google Maps integrations.*

| # | Verb | Endpoint | Controller @ Action | PRD Feature |
|---|---|---|---|---|
| 30 | **GET** | `/api/maps/destination/{id}` | `Api\MapController@destination` | Attractions, Hotels, Restaurants Locations |
| 31 | **GET** | `/api/maps/trip/{id}` | `Api\MapController@tripRoutes` | Route Directions between trip itinerary points |

---

## Module 8: User Dashboard
*Private area for registered users to manage their data.*

| # | Verb | Endpoint | Controller @ Action | PRD Feature |
|---|---|---|---|---|
| 32 | **GET** | `/dashboard` | `DashboardController@index` | Trip Statistics & Overview |
| 33 | **GET** | `/dashboard/trips` | `TripController@index` | Saved Trips & Booking History |
| 34 | **GET** | `/dashboard/favourites` | `FavouriteController@index` | Favorite Destinations & Places |

---

## Module 9: Admin Dashboard (Laravel)
*Complete administration panel. All routes prefixed with `/admin` and protected by `role:admin` middleware.*

### 9.1 User Management
| # | Verb | Endpoint | Controller @ Action | PRD Feature |
|---|---|---|---|---|
| 35 | **GET** | `/admin/users` | `Admin\UserController@index` | View Users |
| 36 | **POST** | `/admin/users` | `Admin\UserController@store` | Add Users |
| 37 | **PUT** | `/admin/users/{user}` | `Admin\UserController@update` | Edit Users |
| 38 | **DELETE** | `/admin/users/{user}` | `Admin\UserController@destroy` | Delete Users |
| 39 | **PATCH** | `/admin/users/{user}/status/activate` | `Admin\UserController@activate` | Activate Account |
| 40 | **PATCH** | `/admin/users/{user}/status/block` | `Admin\UserController@block` | Block Account |

### 9.2 Trips Management
| # | Verb | Endpoint | Controller @ Action | PRD Feature |
|---|---|---|---|---|
| 41 | **GET** | `/admin/trips` | `Admin\TripController@index` | View Trips |
| 42 | **PUT** | `/admin/trips/{trip}` | `Admin\TripController@update` | Edit Trips |
| 43 | **DELETE** | `/admin/trips/{trip}` | `Admin\TripController@destroy` | Delete Trips |

### 9.3 Destinations Management
| # | Verb | Endpoint | Controller @ Action | PRD Feature |
|---|---|---|---|---|
| 44 | **CRUD** | `/admin/countries` | `Admin\CountryController@*` | Countries CRUD |
| 45 | **CRUD** | `/admin/cities` | `Admin\DestinationController@*` | Cities CRUD |
| 46 | **CRUD** | `/admin/attractions` | `Admin\AttractionController@*` | Attractions CRUD |

### 9.4 Categories Management
| # | Verb | Endpoint | Controller @ Action | PRD Feature |
|---|---|---|---|---|
| 47 | **CRUD** | `/admin/categories` | `Admin\CategoryController@*` | Manage Beaches, Mountains, Museums, etc. |

### 9.5 Hotels & Restaurants Management
| # | Verb | Endpoint | Controller @ Action | PRD Feature |
|---|---|---|---|---|
| 48 | **CRUD** | `/admin/hotels` | `Admin\HotelController@*` | Add, Edit, Delete Hotels |
| 49 | **CRUD** | `/admin/restaurants` | `Admin\RestaurantController@*` | Manage Restaurants, Ratings, Categories |

### 9.6 Reviews Management
| # | Verb | Endpoint | Controller @ Action | PRD Feature |
|---|---|---|---|---|
| 50 | **GET** | `/admin/reviews` | `Admin\ReviewController@index` | View all reviews |
| 51 | **PATCH** | `/admin/reviews/{review}/status/approve` | `Admin\ReviewController@approve` | Approve Review (Moderate/Publish) |
| 52 | **PATCH** | `/admin/reviews/{review}/status/reject` | `Admin\ReviewController@reject` | Reject Review (Hide) |
| 53 | **DELETE** | `/admin/reviews/{review}` | `Admin\ReviewController@destroy` | Delete Reviews |

### 9.7 Contact Messages
| # | Verb | Endpoint | Controller @ Action | PRD Feature |
|---|---|---|---|---|
| 54 | **GET** | `/admin/contacts` | `Admin\ContactController@index` | Manage user inquiries |
| 55 | **PATCH** | `/admin/contacts/{contact}/status/read` | `Admin\ContactController@markRead` | Mark message as Read |
| 56 | **PATCH** | `/admin/contacts/{contact}/status/resolve` | `Admin\ContactController@markResolved` | Mark message as Resolved |

### 9.8 Analytics Dashboard & Website Settings
| # | Verb | Endpoint | Controller @ Action | PRD Feature |
|---|---|---|---|---|
| 57 | **GET** | `/admin` | `Admin\DashboardController@index` | Analytics Charts (Users, Popular Destinations, Revenue) |
| 58 | **GET** | `/admin/settings` | `Admin\SettingController@index` | Manage Logo, Site Name, Contact Info, Socials |
| 59 | **PUT** | `/admin/settings` | `Admin\SettingController@update` | Save Settings |