# Implementation Plan: User Interactions (Community) & External API Strategy

## Overview
This document outlines the architectural strategy and implementation plan for the "User Interactions (Community)" module (Phase 1.6), which includes Polymorphic Favorites and Reviews. It also establishes the core strategy for handling external API entities (Hotels, Flights, Restaurants) within the ThreeDOS N-tier architecture.

## Architectural Decision: Handling External APIs & Polymorphic Relations

**The Challenge:**
Standard Laravel polymorphic relationships (`favourites`, `reviews`) rely on linking to a local database ID. However, searching for Hotels (RapidAPI) or Flights (OpenFlights) returns external entities that do not naturally exist in our local database.

**The Solution: "Shadow Modeling" (Hybrid Approach)**
Instead of mirroring entire global databases (ETL syncing, which is slow and bloated) or fetching on-the-fly for every relation (which causes N+1 HTTP calls and slow reads), we will use **Shadow Modeling**.

1.  **Search/List:** Handled via External APIs, heavily cached using Laravel's Cache store.
2.  **Interaction (Favorite/Review/Book):** When a user interacts with an external entity (e.g., `POST /api/v1/favourites/hotel/ext_12345`), the system intercepts the request.
3.  **Shadow Creation:** The `HotelService` checks if `ext_12345` exists locally. If not, it fetches the details from the External API (RapidAPI) once, and persists a "Shadow Record" in the local `hotels` table.
4.  **Local Relation:** The Favorite or Review is then attached to this local Shadow Record using standard Eloquent Polymorphic relationships.

**Benefits:**
*   Standard Laravel Eloquent relationships (`morphMany`, `morphedByMany`) work perfectly.
*   Zero N+1 HTTP calls when retrieving a user's profile, favorites, or reviews.
*   Database stays lean (only interacted-with entities are stored).
*   Highly resilient (if external API goes down, users can still see their favorites/reviews).

## N-Tier Structure for External APIs

1.  **API Clients (`App\Infrastructure\External\`)**
    *   Dedicated classes for external communication (e.g., `RapidApiHotelClient`).
    *   Uses Laravel `Http::retry()` and timeouts for resilience.
2.  **DTOs (`App\DTOs\`)**
    *   Standardizes external JSON responses into typed objects (`HotelDTO`).
3.  **Services (`App\Services\`)**
    *   `HotelService::resolveEntity($externalId)`: Implements the Shadow Modeling logic (Find local -> Or fetch external -> Save local -> Return local).
4.  **Interactors (`App\Services\InteractionService`)**
    *   Handles the business logic for adding/removing favorites and reviews.

## Implementation Phases

### Phase 1: Database Foundation
*   Ensure `hotels`, `restaurants`, and `flights` tables have an `external_id` (string/indexed) and `provider` column.
*   Create `favourites` and `reviews` tables with polymorphic columns (`morphtype`, `morph_id`).

### Phase 2: External Integration Layer
*   Implement `RapidApiHotelClient`, `RapidApiRestaurantClient`, and `FlightClient`.
*   Implement Caching decorators or wrap HTTP calls in `Cache::remember`.

### Phase 3: Shadow Modeling & Services
*   Implement `resolveEntity()` logic in domain services.
*   Implement `FavouriteService` and `ReviewService`.

### Phase 4: API Endpoints (Controllers & Requests)
*   Implement endpoints for `POST /favourites/{type}/{id}`, `POST /reviews/{type}/{id}`, and `DELETE /reviews/{id}`.
*   Implement Form Requests for validation.
*   Implement API Resources for unified responses.
