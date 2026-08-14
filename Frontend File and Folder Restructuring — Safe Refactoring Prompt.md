# Frontend File & Folder Restructuring — Safe Architecture Refactor

You are working on:

```text
fullstack/
└── Frontend/
```

## OBJECTIVE

Reorganize the existing frontend into a **clean, scalable, maintainable folder and subfolder structure following frontend best practices**, while preserving **100% of the current functionality and behavior**.

This is a **STRUCTURAL REFACTOR**, not a feature-development task and not a UI redesign.

The existing frontend already contains working infrastructure for:

- API communication
- Authentication/session management
- Role-based redirects
- Dynamic API configuration
- Pagination
- Shared entity logic
- Admin CRUD
- Admin dashboard
- Admin analytics
- Toast/error handling
- Image fallbacks

The audit specifically identifies `api.js`, `session.js`, `config.js`, `explore.js`, `entity.js`, `admin-crud.js`, `admin-dashboard.js`, and `admin-analytics.js` as existing frontend responsibilities. Preserve their behavior during restructuring.

---

# PHASE 1 — FULL DISCOVERY BEFORE CHANGING ANYTHING

Before moving, renaming, deleting, or creating files:

1. Inspect the **entire `fullstack/Frontend` directory**.
2. Build a complete inventory of:
   - HTML files
   - JavaScript files
   - CSS files
   - images
   - icons
   - fonts
   - configuration files
   - shared components
   - page-specific scripts
   - admin scripts
   - customer scripts
   - agency scripts
   - utilities
   - services
3. Identify the current architectural relationships between them.
4. Search for every reference to each file:
   - HTML `<script src="">`
   - HTML `<link href="">`
   - HTML `<img src="">`
   - anchor/navigation paths
   - JavaScript imports
   - JavaScript dynamic imports
   - CSS `url(...)`
   - JavaScript redirects
   - dynamically generated URLs
   - hard-coded asset paths
5. Identify which files are:
   - global/shared
   - feature-specific
   - page-specific
   - reusable
   - legacy
   - unused
6. Identify duplicate responsibilities and unnecessary duplication.

### IMPORTANT

**Do NOT decide on the final folder structure before completing this analysis.**

First understand the existing architecture.

Then propose the best structure based on the actual codebase.

---

# PHASE 2 — DESIGN THE TARGET STRUCTURE

After discovery, design a target structure that follows these principles:

```text
Pages
↓
Feature / Module Logic
↓
Reusable Services
↓
Core Infrastructure
```

The exact folders and names must be determined from the actual project.

Do not create folders just to make the tree look more sophisticated.

Prioritize:

- clear ownership
- separation of concerns
- discoverability
- reuse
- maintainability
- minimal duplication
- predictable imports/paths

---

# PHASE 3 — RECOMMENDED ORGANIZATION

Use this architectural model **only where it matches the existing codebase**.

## Pages

HTML entry points should be grouped according to their application area:

```text
pages/
├── auth/
├── customer/
├── agency/
└── admin/
```

Admin pages should be grouped by domain/entity rather than remaining as a large flat directory.

For example:

```text
pages/
└── admin/
    ├── users/
    ├── destinations/
    ├── hotels/
    ├── restaurants/
    ├── attractions/
    ├── categories/
    ├── countries/
    ├── flights/
    ├── trips/
    ├── reviews/
    ├── analytics/
    ├── settings/
    ├── contacts/
    ├── notifications/
    └── reports/
```

Do not create a folder for an area unless that area actually exists in the project.

---

# JAVASCRIPT ORGANIZATION

Organize JavaScript by responsibility.

A possible structure:

```text
assets/js/
├── core/
├── components/
├── services/
├── modules/
└── main.js
```

## `core/`

Application-wide infrastructure.

Examples:

```text
api.js
config.js
session.js
storage.js
error handling
```

The existing `api.js` must remain the central API transport layer.

The audit confirms that it already handles:

- authorization headers
- `/v1` path normalization
- response unwrapping
- 401 handling

Do not duplicate these responsibilities elsewhere.

`session.js` must remain responsible for authentication/session and role handling rather than being duplicated across pages.

---

## `services/`

Put domain/API access logic here when the existing code supports this separation.

For example:

```text
services/
├── auth.service.js
├── destination.service.js
├── hotel.service.js
├── restaurant.service.js
├── attraction.service.js
├── trip.service.js
├── review.service.js
└── user.service.js
```

A service should communicate with the shared API layer.

Avoid putting repeated raw `fetch()` logic into individual pages.

However, **do not create artificial services if the existing project does not need them**.

---

## `modules/`

Feature-specific behavior.

Possible structure:

```text
modules/
├── auth/
├── customer/
├── agency/
└── admin/
```

Admin-specific logic can be organized by feature/entity where useful.

The existing `admin-crud.js` should remain reusable if it is currently a generic CRUD engine. Do not create separate duplicated CRUD implementations for every admin page unless the actual requirements justify it.

---

# CSS ORGANIZATION

Organize CSS by responsibility rather than keeping unrelated styles in one directory.

Possible structure:

```text
assets/css/
├── base/
├── components/
├── layouts/
├── pages/
└── main.css
```

Use:

```text
base/
    global foundation

components/
    reusable UI styling

layouts/
    navbar/sidebar/footer/layout styling

pages/
    page-specific styling
```

Do not rewrite the existing design.

Do not introduce a new CSS framework.

Do not duplicate existing styles.

---

# ASSET ORGANIZATION

Organize assets logically:

```text
assets/
├── images/
│   ├── logos/
│   ├── destinations/
│   ├── hotels/
│   ├── restaurants/
│   ├── attractions/
│   ├── avatars/
│   └── placeholders/
├── icons/
└── fonts/
```

Only use categories that are actually relevant to the current project.

Do not rename assets unless necessary.

---

# PHASE 4 — MOVE FILES SAFELY

When restructuring:

1. Move files only after their dependencies are understood.
2. Update every affected reference.
3. Recalculate all relative paths.
4. Check all imports.
5. Check all navigation links.
6. Check all redirects.
7. Check dynamically generated paths.
8. Check CSS asset paths.
9. Check JavaScript asset paths.

For example, a page moved from:

```text
admin/users.html
```

to:

```text
pages/admin/users/index.html
```

will require its relative paths to be recalculated.

Do not assume the old paths continue to work.

---

# PHASE 5 — DO NOT CHANGE BACKEND/API CONTRACT

This task must NOT modify:

```text
Backend/
```

Do not:

- modify Laravel controllers
- modify models
- modify migrations
- modify API routes
- modify authentication logic
- modify database structure
- modify seeders
- modify API response contracts

The audit documents the existing `/api/...` backend contract and confirms the frontend already has normalization for `/v1/...` compatibility. Preserve that behavior.

Do not change an API endpoint simply because a frontend file was moved.

---

# PHASE 6 — PRESERVE EXISTING FUNCTIONALITY

The following MUST continue working exactly as before:

## Authentication

- Login
- Register
- Forgot password
- Reset password
- Email verification
- Logout
- Session handling
- Role-based redirects

## Customer

- Dashboard
- Explore
- Destination/entity pages
- Trips
- Planner
- Favourites
- Reviews
- Subscription
- Profile

## Agency

- Agency dashboard
- Requests
- Assignments
- Profile

## Admin

All existing admin pages and functionality.

The audit identifies 18 admin pages and confirms existing admin CRUD/dashboard/analytics functionality.

## API

Preserve:

- API base URL resolution
- authentication headers
- `/v1` normalization
- response unwrapping
- pagination handling
- 401 handling
- error handling

These behaviors are explicitly documented as already implemented.

---

# PHASE 7 — UNUSED FILES

Do NOT delete files simply because they look unnecessary.

Before deletion, verify:

```text
HTML references
JS imports
CSS references
dynamic references
navigation
redirects
deployment references
```

Only delete a file when you can demonstrate that it is unused.

If uncertain:

**keep it and report it.**

---

# PHASE 8 — DO NOT OVER-ENGINEER

Do NOT:

- convert the project to React
- convert the project to Vue
- introduce Vite
- introduce Webpack
- introduce TypeScript
- convert HTML to Blade
- introduce a build system
- rewrite existing JavaScript
- rewrite existing CSS
- redesign the UI
- change business logic
- change API behavior
- create unnecessary abstractions
- create excessive folder nesting
- duplicate components
- duplicate CRUD logic
- create generic `utils/` dumping grounds

The goal is:

**better organization of the existing frontend — not a new frontend architecture.**

---

# PHASE 9 — VALIDATION

After restructuring, perform a complete verification.

## File validation

Check:

```text
HTML references
CSS references
JavaScript references
imports
images
icons
fonts
navigation
redirects
```

## Functional validation

Verify:

```text
Authentication
Authorization
Role redirects
Customer pages
Agency pages
Admin pages
CRUD
Search
Filtering
Pagination
Dashboard
Analytics
Notifications
Reviews
Trips
Subscriptions
```

## API validation

Verify that the frontend still communicates correctly with the existing backend `/api/...` endpoints.

The audit shows that the backend currently exposes 144 endpoints across account, catalog, trips/planning, commerce, and system modules. Do not alter that contract during this refactor.

---

# PHASE 10 — FINAL REPORT

After completing the refactor, provide a concise report containing:

## 1. Previous structure

```text
...
```

## 2. Final structure

```text
...
```

## 3. Files moved

```text
old/path
→
new/path
```

## 4. Files renamed

```text
old name
→
new name
```

## 5. Files deleted

Only confirmed-unused files.

## 6. References updated

List the important path/import changes.

## 7. Validation

Report:

```text
HTML references        PASS/FAIL
CSS references         PASS/FAIL
JS references          PASS/FAIL
Images                 PASS/FAIL
Navigation             PASS/FAIL
Authentication         PASS/FAIL
Role redirects         PASS/FAIL
API communication      PASS/FAIL
Customer functionality PASS/FAIL
Agency functionality   PASS/FAIL
Admin functionality    PASS/FAIL
```

## 8. Remaining Issues

Explicitly list anything that could not be verified.

Never claim something is fixed or working unless it was actually verified.

---

# FINAL NON-NEGOTIABLE RULE

**Analyze → Design → Restructure → Update References → Validate.**

Do not:

```text
Move files first
↓
Fix whatever breaks later
```

Instead:

```text
Understand dependencies
↓
Define ownership
↓
Design structure
↓
Move files
↓
Update references
↓
Validate all functionality
```

This is a **safe frontend restructuring task**.

The final result must be easier to understand and maintain than the current structure **without changing the application's behavior or backend contract**.