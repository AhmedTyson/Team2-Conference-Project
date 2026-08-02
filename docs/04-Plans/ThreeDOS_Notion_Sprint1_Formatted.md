<callout icon="💡" color="blue_bg">
	**Purpose of this document:** <span color="yellow_bg">Sprint 1 backend integration contract for the ThreeDOS Travel Planner. This defines what the frontend sends and receives.</span>
</callout>

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

### Access Level Key
- 🌐 **Public** → no token needed
- 🔒 **Auth** → any logged-in user
- 🛡️ **Admin** → logged-in user with `role = admin`
- 👤 **Owner** → logged-in user, and must own the resource

---
## 1. Quick Reference — Endpoint Summary Tables
> Backend tasks assigned based on team structure. Deadline: Sunday 11:59 pm.

### 1.1 Authentication
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

### 1.3 Core Trip Planner
<table header-row="true">
<tr><td>#</td><td>Method</td><td>Route</td><td>Description</td><td>Authorize</td><td>Backend</td></tr>
<tr><td>1</td><td>GET</td><td>`/api/trips/create`</td><td>Select Destination, Days, Budget.</td><td>🔒 Auth</td><td>FADY</td></tr>
<tr><td>2</td><td>POST</td><td>`/api/trips`</td><td>Save basic Trip parameters.</td><td>🔒 Auth</td><td>FADY</td></tr>
<tr><td>3</td><td>GET</td><td>`/api/trips/{trip}`</td><td>View Daily Travel Itinerary.</td><td>👤 Owner</td><td>FADY</td></tr>
<tr><td>4</td><td>POST</td><td>`/api/trips/{trip}/attach/{type}`</td><td>Attach Hotels / Restaurants.</td><td>👤 Owner</td><td>ADHAM</td></tr>
<tr><td>5</td><td>DELETE</td><td>`/api/trips/{trip}/detach/{id}`</td><td>Remove attached items.</td><td>👤 Owner</td><td>ADHAM</td></tr>
</table>

### 1.4 Explore Directory (Public)
<table header-row="true">
<tr><td>#</td><td>Method</td><td>Route</td><td>Description</td><td>Authorize</td><td>Backend</td></tr>
<tr><td>1</td><td>GET</td><td>`/api/destinations`</td><td>List all destinations + filters.</td><td>🌐 Public</td><td>KENZY</td></tr>
<tr><td>2</td><td>GET</td><td>`/api/destinations/{id}`</td><td>Destination details + Leaflet map.</td><td>🌐 Public</td><td>KENZY</td></tr>
<tr><td>3</td><td>GET</td><td>`/api/hotels`</td><td>List hotels + search & filter.</td><td>🌐 Public</td><td>KENZY</td></tr>
<tr><td>4</td><td>GET</td><td>`/api/hotels/{id}`</td><td>Hotel details.</td><td>🌐 Public</td><td>KENZY</td></tr>
<tr><td>5</td><td>GET</td><td>`/api/restaurants`</td><td>List restaurants + filter.</td><td>🌐 Public</td><td>HANA</td></tr>
<tr><td>6</td><td>GET</td><td>`/api/restaurants/{id}`</td><td>Restaurant details.</td><td>🌐 Public</td><td>HANA</td></tr>
<tr><td>7</td><td>GET</td><td>`/api/attractions`</td><td>List attractions.</td><td>🌐 Public</td><td>HANA</td></tr>
<tr><td>8</td><td>GET</td><td>`/api/attractions/{id}`</td><td>Attraction details.</td><td>🌐 Public</td><td>HANA</td></tr>
</table>

### 1.5 Categories
<table header-row="true">
<tr><td>#</td><td>Method</td><td>Route</td><td>Description</td><td>Authorize</td><td>Backend</td></tr>
<tr><td>1</td><td>GET</td><td>`/api/categories`</td><td>List categories as clickable cards.</td><td>🌐 Public</td><td>RANA</td></tr>
<tr><td>2</td><td>GET</td><td>`/api/categories/{id}`</td><td>View everything in a specific category.</td><td>🌐 Public</td><td>RANA</td></tr>
<tr><td>3</td><td>GET</td><td>`/api/admin/categories`</td><td>Manage category definitions (CRUD).</td><td>🛡️ Admin</td><td>RANA</td></tr>
</table>

### 1.6 User Interactions (Community)
<table header-row="true">
<tr><td>#</td><td>Method</td><td>Route</td><td>Description</td><td>Authorize</td><td>Backend</td></tr>
<tr><td>1</td><td>POST</td><td>`/api/favourites/{type}/{id}`</td><td>Add/Remove Favorite (Polymorphic).</td><td>🔒 Auth</td><td>TYSON</td></tr>
<tr><td>2</td><td>POST</td><td>`/api/reviews/{type}/{id}`</td><td>Submit a review (saved as pending).</td><td>🔒 Auth</td><td>TYSON</td></tr>
<tr><td>3</td><td>DELETE</td><td>`/api/reviews/{id}`</td><td>Delete user review.</td><td>👤 Owner</td><td>TYSON</td></tr>
</table>

### 1.7 Missing Endpoints (Future Sprints)
<callout icon="⚠️" color="yellow_bg">
	**Pending Feature Scope:** We will add these endpoints later when the business logic is finalized. They are currently drafted but unassigned.
</callout>
<table header-row="true">
<tr><td>#</td><td>Method</td><td>Route</td><td>Description</td><td>Authorize</td><td>Backend</td></tr>
<tr><td>1</td><td>GET</td><td>`/api/admin/reports`</td><td>List generated PDF/CSV exports.</td><td>🛡️ Admin</td><td>TBD</td></tr>
<tr><td>2</td><td>POST</td><td>`/api/admin/reports/generate`</td><td>Generate Revenue/Growth reports.</td><td>🛡️ Admin</td><td>TBD</td></tr>
<tr><td>3</td><td>POST</td><td>`/api/payments/checkout`</td><td>Init Stripe/PayPal booking session.</td><td>🔒 Auth</td><td>TBD</td></tr>
<tr><td>4</td><td>POST</td><td>`/api/payments/webhook`</td><td>Receive payment gateway callbacks.</td><td>🌐 Public</td><td>TBD</td></tr>
<tr><td>5</td><td>GET</td><td>`/api/transactions`</td><td>List user payment history/receipts.</td><td>👤 Owner</td><td>TBD</td></tr>
</table>