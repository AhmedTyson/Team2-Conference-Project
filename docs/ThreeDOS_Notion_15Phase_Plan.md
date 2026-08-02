# 🗺️ Sprint 1: 15-Phase Implementation Plan

<callout icon="🎯" color="blue_bg">
**OVERVIEW**
This document breaks down the Sprint 1 Notion assignments (Auth, Onboarding, Trip, Explore, Category, Interaction) into **15 actionable implementation phases**. 
Deadline: **Sunday 11:59 PM**.
</callout>

---

## 🛠️ Foundation (Team Effort)
### Phase 1: Repository & Environment Setup
*   **Action:** Initialize Laravel 12, configure `.env`, install Breeze and Spatie Permissions.
*   **Output:** Base GitHub repository ready for branching.

### Phase 2: Database Schema & Models
*   **Action:** Create the migrations and Eloquent models for Sprint 1 entities (Users, Surveys, Trips, Destinations, Places, Reviews, Favourites).
*   **Output:** `php artisan migrate` runs successfully.

---

## 🔐 Module 1: Auth & Identity (Sara & Lojy)
### Phase 3: Registration & Login Flows
*   **Action:** Scaffold and customize the Laravel Breeze views for `/login`, `/register`, and `/logout`.
*   **Output:** Users can securely authenticate.

### Phase 4: Role Setup & Password Recovery
*   **Action:** Configure Spatie `admin` and `customer` roles. Implement `/forgot-password` and `/verify-email`.
*   **Output:** RBAC middleware is active; email recovery works.

### Phase 5: Profile Management
*   **Action:** Build the `ProfileController@edit` and `@update` methods for updating name, email, and uploading a `profile_image`.
*   **Output:** Users can manage their identity.

---

## 📋 Module 2: Onboarding (Sama)
### Phase 6: Preference Survey
*   **Action:** Build the `/onboarding` wizard capturing Travel Style, Budget, and Interests.
*   **Output:** Survey data is saved to the `surveys` table as JSON.

---

## 🗂️ Module 4 & 4.5: Explore & Categories (Kenzy, Hana, Rana)
### Phase 7: Categories & Destinations
*   **Action:** Implement `CategoryController` (Rana) and the first half of `DestinationController` (Kenzy).
*   **Output:** Users can view `/categories` and `/destinations`.

### Phase 8: Hotels & Restaurants
*   **Action:** Implement `HotelController` and `RestaurantController` (Kenzy/Hana split).
*   **Output:** Users can search and filter accommodations and dining.

### Phase 9: Attractions & Details
*   **Action:** Implement `AttractionController` and the individual `{id}` show pages (Hana).
*   **Output:** Users can view specific details for any attraction.

---

## ✈️ Module 3: Core Trip Planner (Fady & Adham)
### Phase 10: Trip Creation Wizard
*   **Action:** Build `TripController@create` and `@store` (Fady).
*   **Output:** Users can select destinations, days, and budgets to initialize a Trip.

### Phase 11: Trip Dashboard & Timeline
*   **Action:** Build `TripController@show` (Fady).
*   **Output:** Visual representation of the trip and its estimated expenses.

### Phase 12: Attaching Bookings (Pivot)
*   **Action:** Build `BookingController@attach` to link Hotels, Flights, and Attractions to the trip (Adham).
*   **Output:** `hotel_trip` and `flight_trip` pivot tables are populated via AJAX.

### Phase 13: Detaching Bookings
*   **Action:** Build `BookingController@detach` (Adham).
*   **Output:** Users can remove unwanted items from their trip plan.

---

## 💬 Module 5: User Interaction (Tyson)
### Phase 14: Polymorphic Favourites
*   **Action:** Build `FavouriteController@toggle`.
*   **Output:** Users can click a heart icon on any Destination, Hotel, or Restaurant to save it.

### Phase 15: Polymorphic Reviews
*   **Action:** Build `ReviewController@store` and `@destroy`.
*   **Output:** Users can submit 1-5 star ratings (saved as `pending` status).

---
<callout icon="🏁" color="green_bg">
**SPRINT 1 COMPLETION**
Once Phase 15 is merged, Sprint 1 is complete. Modules 6-9 (AI, Maps, Admin Dashboard, Reports, Payments) will be scheduled for Sprint 2.
</callout>