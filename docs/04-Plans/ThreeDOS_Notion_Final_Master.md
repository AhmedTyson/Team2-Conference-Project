# 🌍 ThreeDOS Unified API Specification

<callout icon="💡" color="blue_bg">
	**Purpose of this document:** <span color="yellow_bg">frontend/backend integration contract. This is the source used to generate OpenAPI/Postman collections. Every endpoint below defines exactly what the frontend sends and what it gets back — no backend implementation detail included, since that's not where integration problems come from.</span>
</callout>
---

## 🗂️ Table of Contents (Modules)
<page url="https://app.notion.com/p/3b02c9c07e66818da8efd26fea27847f">🔐 Auth Module</page>
<page url="https://app.notion.com/p/3b02c9c07e6681149154e6f80561f6f3">📋 User Onboarding (Survey)</page>
<page url="https://app.notion.com/p/3b02c9c07e66811688c9e879a2934694">🗺️ Trip Planner Engine</page>
<page url="https://app.notion.com/p/3b02c9c07e6681af8da6fa29a783358d">🌍 Explore Directory</page>
<page url="https://app.notion.com/p/3b02c9c07e66812d8239d1a5ce494f8e">🏷️ Categories Module</page>
<page url="https://app.notion.com/p/3b02c9c07e6681c8ad1ecbfb05bc98eb">💬 User Interactions (Community)</page>
<page url="https://app.notion.com/p/3b02c9c07e6681c6bc27e9c1c407a8ed">🤖 AI & API Proxies</page>
<page url="https://app.notion.com/p/3b02c9c07e6681398656f32c26e2749b">📍 Interactive Maps</page>
<page url="https://app.notion.com/p/3b02c9c07e66817aa9bef754cadd7c9d">📊 User Dashboard</page>
<page url="https://app.notion.com/p/3b02c9c07e6681ff9d08f0526b555a37">💳 Payments & Transactions (Pending)</page>
<page url="https://app.notion.com/p/3b02c9c07e66814d8c44fc8741ba5d5f">👥 Admin Users</page>
<page url="https://app.notion.com/p/3b02c9c07e66812fa5d4d35ec5b8a080">✈️ Admin Trips</page>
<page url="https://app.notion.com/p/3b02c9c07e66817dbdaec7087c7ec532">📍 Admin Destinations</page>
<page url="https://app.notion.com/p/3b02c9c07e668123a322ca57f97195b0">🏨 Admin Hotels & Restaurants</page>
<page url="https://app.notion.com/p/3b02c9c07e6681baa9e9f5dd80ecd8e4">🏷️ Admin Categories</page>
<page url="https://app.notion.com/p/3b02c9c07e6681c1badfdd0839a08cf0">🚨 Admin Reviews Moderation</page>
<page url="https://app.notion.com/p/3b02c9c07e668115b176ed3104cc5009">✉️ Admin Contacts Inbox</page>
<page url="https://app.notion.com/p/3b02c9c07e6681fbb7cee202f9311be9">⚙️ Admin Analytics & Settings</page>
<page url="https://app.notion.com/p/3b02c9c07e66813794adc03c7a39f29c">📄 Admin Reports (Pending)</page>

---
## Global Conventions
<callout icon="🚨" color="red_bg">
	**FRONTEND TEAM:** The access token MUST be sent in the `Authorization: Bearer {token}` HTTP header. **NEVER** put the token inside the JSON request body.
</callout>

### Standard Response Envelope
<callout icon="✅" color="green_bg">
	**Success:**
	```json
{
  "success": true,
  "message": "Human-readable message",
  "data": { }
}
	```
</callout>
<callout icon="🚨" color="red_bg">
	**Error:**
	```json
{
  "success": false,
  "message": "Human-readable error message",
  "errors": { }
}
	```
	<span color="red">Note:</span> `errors` is only present on `422` validation failures.
</callout>

### Status Code Legend (used across every endpoint)
<table header-row="true">
<tr><td>Code</td><td>Meaning</td><td>When</td></tr>
<tr><td>`200`</td><td>OK</td><td>Successful GET/PUT/POST that doesn't create a resource</td></tr>
<tr><td>`201`</td><td>Created</td><td>Successful POST that creates a new resource</td></tr>
<tr><td>`204`</td><td>No Content</td><td>Successful DELETE</td></tr>
<tr><td>`400`</td><td>Bad Request</td><td>Malformed request (rare → usually caught by 422 instead)</td></tr>
<tr><td>`401`</td><td>Unauthorized</td><td>Missing/invalid/expired token</td></tr>
<tr><td>`403`</td><td>Forbidden</td><td>Valid token, but wrong role or not the resource owner</td></tr>
<tr><td>`404`</td><td>Not Found</td><td>Resource ID doesn't exist</td></tr>
<tr><td>`422`</td><td>Unprocessable Entity</td><td>Validation failed</td></tr>
<tr><td>`429`</td><td>Too Many Requests</td><td>Rate limit hit</td></tr>
<tr><td>`500`</td><td>Server Error</td><td>Unhandled failure — frontend should show generic error state</td></tr>
</table>

### Access Level Key
- 🌐 **Public** → no token needed
- 🔒 **Auth** → any logged-in user (customer or admin)
- 🛡️ **Admin** → logged-in user with `role = admin`
- 👤 **Owner** → logged-in user, and must own the resource (checked server-side via Policy)

---
## 1. Quick Reference — Endpoint Summary Tables
> Backend tasks assigned based on team structure. Sprint 1 Deadline: Sunday 11:59 pm.

### 1.1 Auth Module
<table header-row="true">
<tr><td>#</td><td>Method</td><td>Route</td><td>Description</td><td>Authorize</td><td>Backend</td></tr>
<tr><td>1</td><td>POST</td><td>`/api/auth/register`</td><td>User Registration.</td><td>🌐 Public</td><td>SARA / LOJY</td></tr>
<tr><td>2</td><td>POST</td><td>`/api/auth/login`</td><td>Login / Role-Based Access Setup.</td><td>🌐 Public</td><td>SARA / LOJY</td></tr>
<tr><td>3</td><td>POST</td><td>`/api/auth/logout`</td><td>Invalidate session token.</td><td>🔒 Auth</td><td>SARA / LOJY</td></tr>
<tr><td>4</td><td>POST</td><td>`/api/auth/forgot-password`</td><td>Request password reset.</td><td>🌐 Public</td><td>SARA / LOJY</td></tr>
<tr><td>5</td><td>POST</td><td>`/api/auth/verify-email`</td><td>Verify Email.</td><td>🔒 Auth</td><td>SARA / LOJY</td></tr>
<tr><td>6</td><td>GET</td><td>`/api/profile`</td><td>Fetch Profile Management data.</td><td>👤 Owner</td><td>SARA / LOJY</td></tr>
<tr><td>7</td><td>PATCH</td><td>`/api/profile`</td><td>Update Profile Management data.</td><td>👤 Owner</td><td>SARA / LOJY</td></tr>
</table>

### 1.2 User Onboarding (Survey)
<table header-row="true">
<tr><td>#</td><td>Method</td><td>Route</td><td>Description</td><td>Authorize</td><td>Backend</td></tr>
<tr><td>1</td><td>GET</td><td>`/api/onboarding`</td><td>Get user preferences.</td><td>👤 Owner</td><td>SAMA</td></tr>
<tr><td>2</td><td>POST</td><td>`/api/onboarding`</td><td>Save Travel Style, Budget, Interests.</td><td>👤 Owner</td><td>SAMA</td></tr>
</table>

### 1.3 ️ Trip Planner Engine
<table header-row="true">
<tr><td>#</td><td>Method</td><td>Route</td><td>Description</td><td>Authorize</td><td>Backend</td></tr>
<tr><td>1</td><td>GET</td><td>`/api/trips/create`</td><td>Select Destination, Days, Budget.</td><td>🔒 Auth</td><td>FADY / ADHAM</td></tr>
<tr><td>2</td><td>POST</td><td>`/api/trips`</td><td>Save basic Trip parameters.</td><td>🔒 Auth</td><td>FADY / ADHAM</td></tr>
<tr><td>3</td><td>GET</td><td>`/api/trips/{trip}`</td><td>View Daily Travel Itinerary.</td><td>👤 Owner</td><td>FADY / ADHAM</td></tr>
<tr><td>4</td><td>POST</td><td>`/api/trips/{trip}/attach/{type}`</td><td>Attach Hotels / Restaurants.</td><td>👤 Owner</td><td>FADY / ADHAM</td></tr>
<tr><td>5</td><td>DELETE</td><td>`/api/trips/{trip}/detach/{id}`</td><td>Remove attached items.</td><td>👤 Owner</td><td>FADY / ADHAM</td></tr>
</table>

### 1.4 Explore Directory
<table header-row="true">
<tr><td>#</td><td>Method</td><td>Route</td><td>Description</td><td>Authorize</td><td>Backend</td></tr>
<tr><td>1</td><td>GET</td><td>`/api/destinations`</td><td>List all destinations + filters.</td><td>🌐 Public</td><td>KENZY / HANA</td></tr>
<tr><td>2</td><td>GET</td><td>`/api/destinations/{id}`</td><td>Destination details + Leaflet map.</td><td>🌐 Public</td><td>KENZY / HANA</td></tr>
<tr><td>3</td><td>GET</td><td>`/api/hotels`</td><td>List hotels + search & filter.</td><td>🌐 Public</td><td>KENZY / HANA</td></tr>
<tr><td>4</td><td>GET</td><td>`/api/hotels/{id}`</td><td>Hotel details.</td><td>🌐 Public</td><td>KENZY / HANA</td></tr>
<tr><td>5</td><td>GET</td><td>`/api/restaurants`</td><td>List restaurants + filter.</td><td>🌐 Public</td><td>KENZY / HANA</td></tr>
<tr><td>6</td><td>GET</td><td>`/api/restaurants/{id}`</td><td>Restaurant details.</td><td>🌐 Public</td><td>KENZY / HANA</td></tr>
<tr><td>7</td><td>GET</td><td>`/api/attractions`</td><td>List attractions.</td><td>🌐 Public</td><td>KENZY / HANA</td></tr>
<tr><td>8</td><td>GET</td><td>`/api/attractions/{id}`</td><td>Attraction details.</td><td>🌐 Public</td><td>KENZY / HANA</td></tr>
</table>

### 1.5 ️ Categories Module
<table header-row="true">
<tr><td>#</td><td>Method</td><td>Route</td><td>Description</td><td>Authorize</td><td>Backend</td></tr>
<tr><td>1</td><td>GET</td><td>`/api/categories`</td><td>List categories as clickable cards.</td><td>🌐 Public</td><td>RANA</td></tr>
<tr><td>2</td><td>GET</td><td>`/api/categories/{id}`</td><td>View everything in a specific category.</td><td>🌐 Public</td><td>RANA</td></tr>
</table>

### 1.6 User Interactions (Community)
<table header-row="true">
<tr><td>#</td><td>Method</td><td>Route</td><td>Description</td><td>Authorize</td><td>Backend</td></tr>
<tr><td>1</td><td>POST</td><td>`/api/favourites/{type}/{id}`</td><td>Add/Remove Favorite (Polymorphic).</td><td>🔒 Auth</td><td>TYSON</td></tr>
<tr><td>2</td><td>POST</td><td>`/api/reviews/{type}/{id}`</td><td>Submit a review (saved as pending).</td><td>🔒 Auth</td><td>TYSON</td></tr>
<tr><td>3</td><td>DELETE</td><td>`/api/reviews/{id}`</td><td>Delete user review.</td><td>👤 Owner</td><td>TYSON</td></tr>
</table>

### 1.7 AI & API Proxies
<table header-row="true">
<tr><td>#</td><td>Method</td><td>Route</td><td>Description</td><td>Authorize</td><td>Backend</td></tr>
<tr><td>1</td><td>GET</td><td>`/api/weather/{city}`</td><td>Weather API: Current weather, temp, wind.</td><td>🌐 Public</td><td>TBD</td></tr>
<tr><td>2</td><td>POST</td><td>`/api/trips/{trip}/generate-ai`</td><td>Trigger OpenAI Itinerary Generation.</td><td>👤 Owner</td><td>TBD</td></tr>
</table>

### 1.8 Interactive Maps
<table header-row="true">
<tr><td>#</td><td>Method</td><td>Route</td><td>Description</td><td>Authorize</td><td>Backend</td></tr>
<tr><td>1</td><td>GET</td><td>`/api/maps/destination/{id}`</td><td>Attractions, Hotels, Restaurants Locations.</td><td>🌐 Public</td><td>TBD</td></tr>
<tr><td>2</td><td>GET</td><td>`/api/maps/trip/{id}`</td><td>Route Directions between trip itinerary points.</td><td>👤 Owner</td><td>TBD</td></tr>
</table>

### 1.9 User Dashboard
<table header-row="true">
<tr><td>#</td><td>Method</td><td>Route</td><td>Description</td><td>Authorize</td><td>Backend</td></tr>
<tr><td>1</td><td>GET</td><td>`/api/dashboard`</td><td>Trip Statistics & Overview.</td><td>👤 Owner</td><td>TBD</td></tr>
<tr><td>2</td><td>GET</td><td>`/api/dashboard/trips`</td><td>Saved Trips & Booking History.</td><td>👤 Owner</td><td>TBD</td></tr>
<tr><td>3</td><td>GET</td><td>`/api/dashboard/favourites`</td><td>Favorite Destinations & Places.</td><td>👤 Owner</td><td>TBD</td></tr>
</table>

### 1.10 Payments & Transactions (Pending)
<table header-row="true">
<tr><td>#</td><td>Method</td><td>Route</td><td>Description</td><td>Authorize</td><td>Backend</td></tr>
<tr><td>1</td><td>POST</td><td>`/api/payments/checkout`</td><td>Init Stripe/PayPal booking session.</td><td>🔒 Auth</td><td>TBD</td></tr>
<tr><td>2</td><td>POST</td><td>`/api/payments/webhook`</td><td>Receive payment gateway callbacks.</td><td>🌐 Public</td><td>TBD</td></tr>
<tr><td>3</td><td>GET</td><td>`/api/transactions`</td><td>List user payment history/receipts.</td><td>👤 Owner</td><td>TBD</td></tr>
</table>

### 1.11 Admin Users
<table header-row="true">
<tr><td>#</td><td>Method</td><td>Route</td><td>Description</td><td>Authorize</td><td>Backend</td></tr>
<tr><td>1</td><td>GET</td><td>`/api/admin/users`</td><td>View Users.</td><td>🛡️ Admin</td><td>ADMIN TEAM</td></tr>
<tr><td>2</td><td>POST</td><td>`/api/admin/users`</td><td>Add Users.</td><td>🛡️ Admin</td><td>ADMIN TEAM</td></tr>
<tr><td>3</td><td>PUT</td><td>`/api/admin/users/{id}`</td><td>Edit Users.</td><td>🛡️ Admin</td><td>ADMIN TEAM</td></tr>
<tr><td>4</td><td>PATCH</td><td>`/api/admin/users/{id}/activate`</td><td>Activate Account.</td><td>🛡️ Admin</td><td>ADMIN TEAM</td></tr>
<tr><td>5</td><td>PATCH</td><td>`/api/admin/users/{id}/block`</td><td>Block Account.</td><td>🛡️ Admin</td><td>ADMIN TEAM</td></tr>
</table>

### 1.12 ✈️ Admin Trips
<table header-row="true">
<tr><td>#</td><td>Method</td><td>Route</td><td>Description</td><td>Authorize</td><td>Backend</td></tr>
<tr><td>1</td><td>GET</td><td>`/api/admin/trips`</td><td>View Trips.</td><td>🛡️ Admin</td><td>ADMIN TEAM</td></tr>
<tr><td>2</td><td>PUT</td><td>`/api/admin/trips/{id}`</td><td>Edit Trips.</td><td>🛡️ Admin</td><td>ADMIN TEAM</td></tr>
<tr><td>3</td><td>DELETE</td><td>`/api/admin/trips/{id}`</td><td>Delete Trips.</td><td>🛡️ Admin</td><td>ADMIN TEAM</td></tr>
</table>

### 1.13 Admin Destinations
<table header-row="true">
<tr><td>#</td><td>Method</td><td>Route</td><td>Description</td><td>Authorize</td><td>Backend</td></tr>
<tr><td>1</td><td>GET/POST/PUT</td><td>`/api/admin/countries`</td><td>Countries CRUD.</td><td>🛡️ Admin</td><td>ADMIN TEAM</td></tr>
<tr><td>2</td><td>GET/POST/PUT</td><td>`/api/admin/destinations`</td><td>Destinations/Cities CRUD.</td><td>🛡️ Admin</td><td>ADMIN TEAM</td></tr>
<tr><td>3</td><td>GET/POST/PUT</td><td>`/api/admin/attractions`</td><td>Attractions CRUD.</td><td>🛡️ Admin</td><td>ADMIN TEAM</td></tr>
</table>

### 1.14 Admin Hotels & Restaurants
<table header-row="true">
<tr><td>#</td><td>Method</td><td>Route</td><td>Description</td><td>Authorize</td><td>Backend</td></tr>
<tr><td>1</td><td>GET/POST/PUT</td><td>`/api/admin/hotels`</td><td>Hotels CRUD.</td><td>🛡️ Admin</td><td>ADMIN TEAM</td></tr>
<tr><td>2</td><td>GET/POST/PUT</td><td>`/api/admin/restaurants`</td><td>Restaurants CRUD.</td><td>🛡️ Admin</td><td>ADMIN TEAM</td></tr>
</table>

### 1.15 ️ Admin Categories
<table header-row="true">
<tr><td>#</td><td>Method</td><td>Route</td><td>Description</td><td>Authorize</td><td>Backend</td></tr>
<tr><td>1</td><td>GET/POST/PUT</td><td>`/api/admin/categories`</td><td>Manage Beaches, Mountains, etc.</td><td>🛡️ Admin</td><td>RANA</td></tr>
</table>

### 1.16 Admin Reviews Moderation
<table header-row="true">
<tr><td>#</td><td>Method</td><td>Route</td><td>Description</td><td>Authorize</td><td>Backend</td></tr>
<tr><td>1</td><td>GET</td><td>`/api/admin/reviews`</td><td>View all reviews.</td><td>🛡️ Admin</td><td>ADMIN TEAM</td></tr>
<tr><td>2</td><td>PATCH</td><td>`/api/admin/reviews/{id}/approve`</td><td>Approve Review (Publish).</td><td>🛡️ Admin</td><td>ADMIN TEAM</td></tr>
<tr><td>3</td><td>PATCH</td><td>`/api/admin/reviews/{id}/reject`</td><td>Reject Review (Hide).</td><td>🛡️ Admin</td><td>ADMIN TEAM</td></tr>
<tr><td>4</td><td>DELETE</td><td>`/api/admin/reviews/{id}`</td><td>Delete Reviews.</td><td>🛡️ Admin</td><td>ADMIN TEAM</td></tr>
</table>

### 1.17 ✉️ Admin Contacts Inbox
<table header-row="true">
<tr><td>#</td><td>Method</td><td>Route</td><td>Description</td><td>Authorize</td><td>Backend</td></tr>
<tr><td>1</td><td>GET</td><td>`/api/admin/contacts`</td><td>Manage user inquiries.</td><td>🛡️ Admin</td><td>ADMIN TEAM</td></tr>
<tr><td>2</td><td>PATCH</td><td>`/api/admin/contacts/{id}/read`</td><td>Mark message as Read.</td><td>🛡️ Admin</td><td>ADMIN TEAM</td></tr>
<tr><td>3</td><td>PATCH</td><td>`/api/admin/contacts/{id}/resolve`</td><td>Mark message as Resolved.</td><td>🛡️ Admin</td><td>ADMIN TEAM</td></tr>
</table>

### 1.18 ⚙️ Admin Analytics & Settings
<table header-row="true">
<tr><td>#</td><td>Method</td><td>Route</td><td>Description</td><td>Authorize</td><td>Backend</td></tr>
<tr><td>1</td><td>GET</td><td>`/api/admin/analytics`</td><td>Analytics Charts (Users, Revenue).</td><td>🛡️ Admin</td><td>ADMIN TEAM</td></tr>
<tr><td>2</td><td>GET</td><td>`/api/admin/settings`</td><td>Manage Logo, Site Name, Socials.</td><td>🛡️ Admin</td><td>ADMIN TEAM</td></tr>
<tr><td>3</td><td>PUT</td><td>`/api/admin/settings`</td><td>Save Settings.</td><td>🛡️ Admin</td><td>ADMIN TEAM</td></tr>
</table>

### 1.19 Admin Reports (Pending)
<table header-row="true">
<tr><td>#</td><td>Method</td><td>Route</td><td>Description</td><td>Authorize</td><td>Backend</td></tr>
<tr><td>1</td><td>GET</td><td>`/api/admin/reports`</td><td>List generated PDF/CSV exports.</td><td>🛡️ Admin</td><td>TBD</td></tr>
<tr><td>2</td><td>POST</td><td>`/api/admin/reports/generate`</td><td>Generate Revenue/Growth reports.</td><td>🛡️ Admin</td><td>TBD</td></tr>
</table>


