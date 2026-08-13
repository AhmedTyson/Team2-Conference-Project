# Itinari — Frontend

Boarding-pass themed travel platform. Static frontend + Laravel API (`Team2-Conference-Project`).

## Run

1. Serve this folder (PHP built-in or `python -m http.server 8080` from `frontend/`).
   - `python -m http.server 8080` in `frontend/`
2. API at `127.0.0.1:8000` (see backend `php artisan serve`).
3. Open `http://localhost:8080/login.html`.

> `file://` does not work — auth pages redirect to `/login.html` via an absolute path.

## Routes

| Page | File |
| --- | --- |
| Login | `login.html` |
| Register | `register.html` |
| Forgot / Reset | `forgot.html` / `reset.html` |
| Verify | `verify.html` |
| Dashboard (user) | `dashboard.html` |
| Admin | `admin/index.html` |

## Admin Suite (Phase 16, from scratch)

Boarding-pass motif: `.ticket` cards, KPI tickets with `.ticket-edge` notches, `.sil` side-indicator label, `.label-eyebrow` micro-labels, GSAP entrance stagger (reduced-motion guarded).

### Pages

| Page | File | JS |
| --- | --- | --- |
| Dashboard (KPIs, recent bookings) | `admin/index.html` | `admin-dashboard.js` |
| Users | `admin/users.html` | `admin-users.js` |
| Trips | `admin/trips.html` | `admin-trips.js` |
| Reviews | `admin/reviews.html` | `admin-reviews.js` |
| Analytics | `admin/analytics.html` | `admin-analytics.js` |
| Settings | `admin/settings.html` | `admin-settings.js` |
| Attractions (static showcase) | `admin/attractions.html` | — |
| CRUD: Countries / Destinations / Hotels / Restaurants | `admin/countries.html` etc. | `admin-crud.js` (shared) |

Shared: `admin-shell.js` (sidebar/nav), `admin-chrome.js` (topbar, theme toggle, sidebar collapse, global search bus, modal ESC + scroll-lock), `admin-kit.js` (table/empty/badge kit), `config.js` / `session.js` / `api.js` (session + storage). Asset scripts are cache-versioned (`?v=` suffix) — bump when shipping JS/CSS changes.

### Phase 17 — shadcnspace-inspired refinement (vanilla ports)

- **Dark theme**: `.dark` token block in `tokens.css`; toggle in topbar (`#theme-toggle`), persisted in `localStorage` (`itinari_theme`), no flash, `aria-pressed` synced.
- **Topbar**: sticky glass strip on all 10 admin pages with global search (`admin:search` custom event), theme toggle, collapsed brand.
- **Sidebar**: active-link pill + left indicator; collapse button shrinks 264px → 82px icon rail (`itinari_sidebar`), labels/`nav-section` hidden, persisted.
- **Datatable** (`admin-crud.js`): search + sortable headers (aria-sort) + pagination footer. Query contract `?page&per_page&search&sort_by&sort_order`; normalizes `{data:{data,links,meta}}` (server-paged) vs bare array (client-paged). Search also filters users/trips/reviews custom tables.
- **Empty states**: icon + title + hint (+ optional action) on zero rows and on no-match.
- **Dialogs**: ESC closes (focus + scroll-lock release), backdrop blur, internal scroll region, close button.
- **Toasts**: `It.feedback.toast()` bottom-right stack, ~4 s auto-dismiss with progress drain, max 4 concurrent; banner API unchanged for auth pages.
- **Form states**: required-field validation on submit with `is-error` field states; toast on invalid.
- **Stat widgets**: KPI delta chips (neutral labels; no prev-period baseline in backend yet).
- **Chart headers**: icon chip + title in analytics cards.

### Auth & RBAC

- Token stored in `localStorage` under `itinari_token` (admin gate re-uses the user token).
- Admin check: `session.isAdminRole(session.roleOf(user))`; non-admin or missing token → `session.redirectToLogin()`.
- Test creds: `admin@threedos.com` / `password` (seed from backend).

### API

- `GET /v1/admin/analytics` — users + revenue KPIs.
- `GET /v1/admin/analytics/revenue` — bookings KPI + recent bookings.
- CRUD endpoints via `admin-crud.js` per entity.
- All admin calls use `{ auth: true }`.

## Notes

- GSAP 3.12.5 CDN; entrance animations run once after data load; `prefers-reduced-motion: reduce` skips them.
- Density pass: desktop layout targets content `max-width 1320px`, sidebar `264px`; `body[data-page="admin"]` must stay `display: block` (auth.css grids the body for the login card — see admin.css override).

### Phase 18 — Admin Polish & Accessibility

- **Mobile Drawer**: Fixed off-canvas sidebar (<1024px) with backdrop, escape/click-out dismiss.
- **Motion**: Hand-tuned bezier curves (--dur-base, --ease-out) globally applied without stock \ase\ defaults.
- **Theming & Tokens**: Tri-state theme (light/dark/system) stored in itinari_theme. Centralized status colors (ok/warn/danger) in 	okens.css.
- **Data Vis**: Vanilla JS bar charts with shimmer skeletons, aria-live tooltips, and calculated grid ticks.
- **A11y**: Skip links, ARIA labels on icon buttons, SVG ria-hidden, and keyboard focus verification.