# Itinera Clean Code & Architecture Guidelines

Based on the audit of the current codebase, the following strict guidelines must be adopted for the frontend implementation.

## 1. Single Responsibility Initialization
**Problem:** Currently, 11 separate Javascript files manually hook into `DOMContentLoaded`, manually fetch the user token, manually redirect if missing, and manually render the user's name in the topbar.
**Rule:** Only ONE file (`admin-chrome.js`) is responsible for authenticating the layout shell and rendering global components (Sidebar, Topbar). Page-specific files (`admin-users.js`) must only concern themselves with the main `<main>` content.

## 2. API Communication Centralization
**Problem:** `It.apiGet`, `It.apiPost`, etc., are manually invoked with `{ auth: true }` scattered across 40+ different call sites.
**Rule:** `api.js` must be refactored to use an interceptor pattern. If a token exists in `localStorage`, it should *always* be attached to outgoing requests under `/v1/admin/*`. Do not force developers to manually pass `{ auth: true }`.

## 3. Generic Data Tables
**Problem:** `admin-users.js`, `admin-reviews.js`, and `admin-trips.js` duplicate thousands of lines of DOM-manipulation code to build tables, handle sorting, and manage checkboxes.
**Rule:** The `admin-crud.js` file was designed to be generic. ALL tabular data MUST be migrated to the `MODULES` configuration object inside `admin-crud.js`. No standalone list-rendering files are permitted.

## 4. Error Handling Uniformity
**Problem:** Fetch `.catch()` blocks manually recreate DOM nodes to show errors (`<div class="kit-error">...</div>`).
**Rule:** Error state UI must be centralized in `animations.js` (e.g., `It.feedback.showErrorState(hostElement)`).

## 5. Backend Controller Namespaces
**Rule:** All controllers responding to `/api/v1/admin/*` MUST be located in the `App\Http\Controllers\Admin` namespace. Do not pollute the public API namespace with Admin controllers.

## 6. Strict Backend Validation
**Rule:** No model mass-assignment (`User::create()`) may occur without a validated request. Every `store` and `update` method MUST use a FormRequest (`php artisan make:request`) to ensure data integrity and to feed 422 errors automatically to the frontend.

## 7. Mandatory Pagination
**Rule:** `Model::all()` and `Model::get()` are strictly forbidden in Admin index routes. `Model::paginate(15)` must be used to ensure memory safety.