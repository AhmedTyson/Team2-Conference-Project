# Implementation Plan: Monolith to 5-Domain Architecture

## Objective
Reorganize the current flat Laravel structure into a 5-domain modular monolith (`Trips`, `Catalog`, `Commerce`, `Account`, `System`) as specified in the updated architecture prompt. This includes moving Models, Controllers, Repositories, Services, Interfaces, Requests, Factories, Seeders, and Feature Tests into their respective domain subdirectories.

## Current State Analysis
The project currently has a standard, flat Laravel structure. All models are in `app/Models`, all services in `app/Services`, etc.
Additionally, there are duplicate controllers (e.g., `DestinationController`), typo'd migrations, and leftover root files (`refine-upload/`, `.php` scripts, `*.md` docs).

## Dependency Graph & Risk
Moving `Models` and `Interfaces` impacts the entire codebase because of `use` imports and container bindings. 
To minimize downtime and broken states, we will slice the work Domain by Domain (Vertical Slicing).

1. **Pre-requisite (Cleanup)**: Remove garbage files, fix typos, resolve duplicate files.
2. **Domain Migrations**: For each domain, we move its Models, Repositories, Interfaces, Services, Controllers, Requests, and Tests, then run a global Search & Replace for their namespaces across the whole app.
3. **Post-requisite**: Update `AppServiceProvider` and run `composer dump-autoload`.

## Vertical Slicing Strategy
1. **Phase 1**: Housekeeping (Cleanup Checklist from Section 7).
2. **Phase 2**: System Domain Migration (Settings, ContactMessages, Reports, Cache, Weather).
3. **Phase 3**: Account Domain Migration (Users, Auth, Roles, Profiles).
4. **Phase 4**: Catalog Domain Migration (Attractions, Categories, Countries, Destinations, Hotels, Restaurants).
5. **Phase 5**: Trips Domain Migration (Trips, ItineraryItems, Map, AI, Reviews).
6. **Phase 6**: Commerce Domain Migration (Bookings, Payments, Subscriptions, Plans, Orders).

## Testing & Verification
After each domain migration:
- Run `composer dump-autoload`.
- Run `php artisan test` to ensure all imports and namespaces are correctly resolved.
