# Plan — Roles-Aware Frontend (auth → guard → dashboards) | TP-2026-08

## Goal

Turn pure-vanilla login/register frontend into a role-aware app:
1. Merge backend feature branches (Hana, Fady, lojy-case1) so admin CRUD + dashboard + analytics endpoints exist on one trunk.
2. Harden auth contract (register 422 field errors, login returns roles).
3. Up-grade every auth page with the interactive input UX spec (below).
4. Detect the logged-in user's role client-side and redirect correctly (user → `/dashboard.html`, admin/super_admin → `/admin/`).
5. Build user dashboard + role-gated admin shell.
6. Add register (no framework) — already exists in vanilla; enrich it (terms, password strength).

## UX micro-interaction spec (the "effects")

| # | Effect | Where | Notes (port from savory-bistro where marked) |
|---|--------|-------|----------------------------------------------|
| 1 | Focus ring: border color + soft box-shadow on focus | all inputs | `:focus-visible` + `.field input:focus` (exists) |
| 2 | Real-time validation coloring — border green (valid) / coral (invalid) on type & blur | login/register/forgot/reset | add `.is-valid`; keep `.is-error` |
| 3 | Inline hint text updates live (format, strength notes, match confirmation) | all fields | exists; add strength-checklist variant |
| 4 | Debounced simulated **"Checking availability…"** email check (400 ms) | register.email | placeholder for real /register availability |
| 5 | Password show/hide toggle (text ↔ password) | register + login | port Eye/EyeOff pattern from savory-bistro |
| 6 | Password strength meter: 0–5 score, 4-bar meter, 5-rule checklist, match indicator | register (add on login+reset optionally) | copy pure functions from savory-bistro `utils/validation.js` |
| 7 | Shake (GSAP, 5 quick left–right oscillations) on every invalid field at submit — mismatch, empty, checkbox unchecked, bad email | all submit forms | exists; extend to terms checkbox |
| 8 | Submit button `.loading` — spinner, label dims, disabled (no double-submit) | all | exists |
| 9 | Success banner: green, GSAP fade-up + slide-in with progress drain (~4 s) | auth success + dashboard actions | port Toast pattern from savory-bistro, GSAP instead of CSS |
| 10 | `prefers-reduced-motion: reduce` strips all transitions/animations | CSS + JS (GSAP `gsap.globalTimeline` off / `reducedMotion()` guard) | |
| 11 | Keyboard `:focus-visible` outlines visible (never removed inline) | all | |

## What to reuse from C:\Programming\C2C\savory-bistro (analysis done)

- `utils/validation.js` → pure password-strength scorer (0–5) + checklist rules + RFC-style email — port to `validation.js` (`Itinari.Rules.passwordStrength`).
- Eye/EyeOff password toggles (`LoginForm.jsx`, `SignupForm.jsx`).
- Field anatomy: `.field { icon-in-input, label, error class, inline error span }`, error clears on `input`/`change`.
- Toast anatomy (slide+bounce in, progress-drain bar, autohide 4s).
- Login rate-limit w/ cooldown countdown (optional, later).
- **Not reused:** framer-motion (we are GSAP + CSS), localStorage user object (we use JWT token), no-role auth (we add roles), `savory_user` key (we keep `itinari_token`).

## Backend branch inventory (read from git, no naming assumptions)

| Branch | Adds | Notes |
|--------|------|-------|
| origin/Hana | `v1/dashboard` (index/trips/`/destinations`/favourites) + admin CRUD users/reviews/trips/destinations/hotels/attractions/restaurants/countries + `admin/analytics/revenue` | largest; has `permission:` guards |
| origin/Fady | admin CRUD attractions/users/reviews/trips/destinations/hotels | `permission:manage X` on subset |
| origin/lojy-case1 | `role:admin` guard + `admin/analytics` index + reviews moderation | |
| main (feature/paymob-payments) | admin CRUD already present + site-settings | **missing** `v1/dashboard` + `analytics` — merge in from Hana |

## Merge strategy

Merge `origin/Hana` (primary source for dashboard + analytics), then reconcile API/analytics deltas from lojy-case1, then Fady (mostly superseded CRUD — keep only missing permission lines). Resolve `routes/api.php` by hand favoring the union of: existing main admin CRUD + Hana's dashboard + analytics + lojy's global guard posture. Backend contract assertions after merge are in Phase 1 checks.

## Key route contract (frontend consumes)

- `POST /api/login` → 200 `{ token, user:{ id,name,email,roles:[...] } }`, 401 invalid
- `GET /api/v1/dashboard/` → user dashboard payload (Bearer)
- `GET /api/v1/dashboard/trips`, `/favourites`
- `GET /api/v1/admin/analytics` + `revenue` → cards
- `GET /me` / `GET /api/user` → profile + roles (Bearer)
- Admin CRUD `v1/admin/*` ↔ permission guard

## Open unknowns (verify in Phase 1-2, do not assume)

- `DashboardController` response shape (Hana branch) — confirm keys before UI build.
- Analytics payload keys (Hana `revenue` vs lojy `index`).
- JWT guard name for admin pages (`auth:api` from Hana vs `role:admin` from lojy — we implement ONE, note if diverged method of `role:admin`).

## Output

- `tasks/todo.md` — 15 ordered phases, each with checklist + verification.

---

# Admin Suite Rebuild — Boarding-Pass / Departure-Board Motif (Phase 16)

## Decision (2026-08-07)

All 10 admin module pages rebuilt **from scratch** (user choice, no kit reuse).
Shell + pages restyled on the brand signature: perforated ticket edges, dashed
dividers, mono "gate label" eyebrows, flat layered silhouette illustration.
Styling: shadcn restraint via existing zinc tokens — **no new color tokens**.

## Token reuse (from `assets/css/tokens.css`, live)

- Colors: `--background/-foreground`, `--card`, `--border`, `--input`, `--ring`,
  `--primary(/-foreground)`, `--secondary`, `--muted(/-foreground)`, `--accent`,
  `--destructive` — `hsl(var(--x))`, light + `.dark`.
- Radius: `sm/md/lg/xl/full`. Type: `--font-display` (Fraunces), `--font-mono`
  (IBM Plex Mono, gate eyebrows via `--text-eyebrow`), `--font-body` (Inter).
- Spacing `--space-1..8`; shadows `--shadow-sm/md/lg`; `--container-*`.

## Flagged additions (approved)

1. `--motif-perf`: perforation notch size on ticket edges — `calc(var(--radius) * 1.5)`.
   Used only inside `.ticket` notches; no color values invented.
2. Attractions module → **Unreleased placeholder card** (no API call, backend
   `AdminAttractionController` missing).

## Page inventory (from-scratch targets)

| Module | Page | Data via |
|--------|------|----------|
| Dashboard | `admin/index.html` | `v1/admin/analytics` + `/revenue` |
| Users | `admin/users.html` | `v1/admin/users` |
| Trips | `admin/trips.html` | `v1/admin/trips` |
| Destinations | `admin/destinations.html` | `v1/admin/destinations` |
| Hotels | `admin/hotels.html` | `v1/admin/hotels` |
| Restaurants | `admin/restaurants.html` | `v1/admin/restaurants` |
| Countries | `admin/countries.html` | `v1/admin/countries` |
| Reviews | `admin/reviews.html` | `v1/admin/reviews` |
| Analytics | `admin/analytics.html` | `v1/admin/analytics` + `/revenue` |
| Settings | `admin/settings.html` | `v1/admin/settings` |
| Attractions | `admin/attractions.html` | none — unreleased placeholder |

## Delivery order (vertical slices)

1. **Foundation:** new `admin.css` v2 (motif utilities: `.ticket`, `.label-eyebrow`, `.dash`, silhouettes) + shared shell partial.
2. **Dashboard slice:** shell + KPI tickets + recent bookings.
3. **Table slices:** users/trips (list + per-row actions).
4. **CRUD slices:** destinations/hotels/restaurants/countries (grid + modal form).
5. **Moderation slice:** reviews (approve/reject/delete).
6. **Report slice:** analytics (bar charts, ticket KPI) + settings (form).
7. **Placeholder:** attractions unreleased card.
8. **Verify:** Puppeteer 10 modules light/dark + actions, `node --check`.
---

# Phase 17 — Admin Dashboard Refinement (shadcnspace-inspired)

Reference: https://shadcnspace.com/admin-dashboard (production shadcn/ui admin kit, React/Next/TS).

## Stack caveat

shadcnspace is React + Next.js + shadcn/ui + TS. Itinari admin is **vanilla JS + CDN GSAP, no build step**. We do NOT copy components or add a framework. We port **design patterns + UX behaviors** to `admin.css` + shared vanilla JS (`admin-shell.js`, `admin-crud.js`, `admin-kit.js`, `animations.js`). No new dependencies.

## Apply (port) — with reference links

| # | Refinement | Reference | Current state |
|---|-----------|-----------|---------------|
| 1 | Sticky topbar (page title, search, theme toggle, user dropdown) | /blocks/dashboard-ui/dashboard-shell + live demo https://dashboard.shadcnspace.com/ | content-head only, no topbar |
| 2 | Sidebar: active pill + hover states, collapse-to-mini | /blocks/dashboard-ui/sidebars + minisidebar demo https://shadcnspace-dashboard-minisidebar.vercel.app/ | static 264px nav |
| 3 | Stat widgets: icon chip + trend delta vs previous period | /blocks/dashboard-ui/widgets-component | KPI tickets w/o delta |
| 4 | Datatable: global search, click-to-sort columns, pagination footer | /blocks/dashboard-ui/datatable | kit-table static, backend pagination unused in UI |
| 5 | Empty state: icon + title + hint + action button | /blocks/dashboard-ui/empty-state | kit-empty plain text |
| 6 | Dialog: ESC close, backdrop blur, scroll-lock, sizes | /blocks/dashboard-ui/dialog | kit-modal basic |
| 7 | Form field states is-valid/is-error + live hints in CRUD modal | /blocks/dashboard-ui/forms | auth-only; CRUD modal none |
| 8 | Corner toast stack w/ auto-dismiss + progress drain | shadcn toast (see /components) | feedback.banner single line |
| 9 | Full dark theme: `[data-theme=dark]` token block + toggle | dark demo https://shadcnspace-dashboard-dark.vercel.app/ | no dark tokens anywhere |
| 10 | Chart card headers consistent with widgets | /blocks/dashboard-ui/charts-component | charts exist, minor polish |

## Reject

- React/Next/TS/shadcn stack, Supabase/NextAuth/Firebase auth — stack mismatch; backend owns auth.
- AI Ops / AI prompt library — no AI in product.
- RTL, e-commerce, marketing/landing/blog pages — out of product scope.
- Paid download of template — port patterns only.

## Delivery order (dependency-driven)

1. Theme foundation (dark tokens + toggle) — everything visual depends on token set.
2. Topbar shell (search + theme toggle + user dropdown) across 10 admin pages.
3. Sidebar refine (active pill, hover, mini collapse).
4. Stat widgets w/ deltas (dashboard).
5. Datatable (search/sort/pagination) — largest slice.
6. Empty state + skeleton polish.
7. Dialog polish (ESC/blur/scroll-lock).
8. Toast stack.
9. Form states in CRUD modal.
10. Charts header polish.
11. Verify sweep (puppeteer light/dark + actions).


## Phase 17 — Frontend query contract (datatable · endpoints)

Backend (Laravel `Team2-Conference-Project/routes/api.php`) does NOT yet implement
pagination/filtering. Frontend ships it now; backend may optimize later. Contract:

| Resource | List endpoint | Current backend response | Frontend mode |
|---|---|---|---|
| Destinations | `GET /v1/admin/destinations` | bare array (`{data:[...]}` or array) | client-side page/sort/search |
| Hotels | `GET /v1/admin/hotels` | paginated `{data:{data,links,meta}}` | server-paged; client filters page |
| Restaurants | `GET /v1/admin/restaurants` | bare array | client-side |
| Countries | `GET /v1/admin/countries` | bare array | client-side |
| Users | `GET /v1/admin/users` | bare array | client-side search (kit grid) |
| Trips | `GET /v1/admin/trips` | bare array | client-side search (kit grid) |
| Reviews | `GET /v1/admin/reviews` | bare array | client-side search (kit grid) |
| Analytics | `GET /v1/admin/analytics` + `GET /v1/admin/analytics/revenue` | aggregate object | widgets |

Query parameters the frontend already sends (server contract for future):
`?page=1&per_page=6&search=<term>&sort_by=<field>&sort_order=asc|desc`

Normalization: `{data:{data:[...],meta}}` → use `data.data` (server-paged, meta.total for pager);
bare `{data:[...]}` or `[...]` → treat as full set, slice client-side. Pager shown only when
rows > 1 page (client mode) or meta present (server mode).

Validation contract (CRUD modal): required fields checked at submit; `is-error` field state +
hint; cleared on re-submit; positive `is-valid` shown after successful save via toast.

---


# UI/UX Optimization — Phase 0–14 (shadcnspace reference + world best practices)

**Scope:** Re-work the vanilla admin suite (10 modules). Stay vanilla (no React/Next/TypeScript), port **patterns** only — same rule as Phase 17. Shadcnspace (`https://shadcnspace.com/admin-dashboard`) is a premium shadcn/ui + Next.js kit; we take layouts/behavior/primitives, not code. 15 phases (0–14), ordered bottom-up: shell → primitives → content → polish.

## 1. Reference analysis — shadcnspace admin-dashboard

| Kit feature | What we observe | Current admin suite | Verdict |
|---|---|---|---|
| 5 layout variants (Main, Mini, Horizontal, Light, RTL) | Icon+label sidebar, centered thin rail, modern top | Main ≈ ours | Apply Main as-is; fix collapsed mode (Phase 1); RTL/Horizontal rejected |
| Main sidebar | grouped sections, active highlight + left indicator, hover states | done in Ph17 | keep (Phase 0 lock) |
| Mini sidebar | 48–64px icon rail, **tooltips on hover**, brand mark only | broken: `display:none` labels, empty rail, no tooltip, no transition | Phase 1 |
| Topbar | sticky, search trigger, theme switch, avatar + dropdown, breadcrumb | sticky search+theme exist; avatar chip is *not* a menu; breadcrumb not present | Phase 2, 4 |
| Command palette | ⌘K search, grouped results, keyboard-first | absent — search only filters current table | Phase 3 |
| Data table | sticky header, column toggle, density, bulk actions, pagination meta | search/sort/pager via Ph17; rest absent | Phase 5, 6 |
| Dialog / dropdown / select / toggle | focus trap, `aria-labelledby`/`aria-modal`, placement, variants | ESC+backdrop+scroll-lock exist; no focus trap, no inline field errors | Phase 7 |
| Toast / skeleton / empty states | toast stack, row skeletons, rich empty states | done in Ph17 | Keep (Phase 8 hardens status) |
| KPI widgets | icon chip, trend delta, sparkline, loading | icon+delta done; no trend/sparkline/skeleton | Phase 9 |
| Charts | axes, tooltips, legends, animation, empty states | bare CSS bars only | Phase 10 |

## 2. What already exists (Phase 17 baseline)

Topbar (sticky, 10px blur) · theme toggle (`html.dark`, persisted) · sidebar collapse (82px rail, persisted) · active pill + left indicator · KPI tickets + delta chips · datatable engine (`admin-crud.js`: search/sort/pagination, normalizes `{data:{data,links,meta}}` vs bare array) · dialog open/close + ESC + scroll-lock · toast stack (`It.feedback.toast`) · empty + skeleton + banner · GSAP entrance w/ reduced-motion guard. Asset cache-versioning `?v=3`.

## 3. Gap report — vs world best practices

### Layout & navigation
- G1 — Collapsed sidebar is the worst offender: nav renders **icons none** (labels-only markup), so a 82px rail shows bare empty square buttons; no hover tooltips; no width transition; active left‑indicator misplaced on squares; wordmark disappears without a monogram; collapse button not centered; `aria-expanded` never flips; no ⌘/Ctrl+B shortcut.
- G2 — No breadcrumb trail (static `GATE C-01` eyebrow only).
- G3 — No user menu: avatar/identity not a menu; no profile shortcut; no dropdown a11y.
- G4 — No command palette (⌘K) / no jump navigation.
- G5 — No mobile drawer: below 1024px the suite keeps the 82px rail — no hamburger/drawer.

### Data table
- G6 — Sticky header absent; headers have no "showing count"; no column visibility or density switch; no bulk selection/actions; no CSV export (of filtered set). Table horizontally overflows on narrow screens (no `.scroll-wrap`).

### Forms & dialogs
- G7 — Inline field errors are color-only (`is-error`), no error *message* with `aria-describedby`; no focus trap in modal (Esc trap exists but Tab leaves); `aria-modal`/`aria-labelledby` missing; no autofocus on first field; Enter submission not guaranteed.

### Theme & tokens
- G8 — Only L/D (no “system” + `prefers-color-scheme`); elevation/shadow scale not themable; global focus ring is per-element; some dark overrides hardcoded (`html.dark .badge-ok` etc.) instead of tokens; no contrast audit.

### Motion & responsiveness
- G9 — No collapse transition; desktop-only interactions; tables/images overflow on mobile; no `prefers-reduced-motion` coverage for new animations.

### A11y & kbd
- G10 — No `skip-link`; nav lacks `aria-current="page"`; dialog focus/trap incomplete; table updates not `aria-live`; kbd shortcuts undocumented; focus order on mobile.

### KPI & charts
- G11 — KPI deltas fake-neutral (no baseline data); no sparkline/trend; charts bare (no axes labels, tooltip, legend, animation); no chart skeleton.

## 4. Dependency order (why this sequence)

```
P0 lock layout ─► P1 sidebar mini ─► P2 user menu/topbar
                                 └─► P3 command palette
                                    P4 breadcrumb/chrome
P5 datatable structure ─► P6 datatable actions
P7 dialog+form primitives ─► P8 toast/status system
P9 KPI widgets ─► P10 charts
P11 theme/tokens ─► P12 mobile+sections (drawer, wrap)
P13 a11y pass ─► P14 final sweep + docs
```

## 5. The 15 phases (each = a testable unit)

### Phase 0 — Layout baseline lock (OK today)
**Description:** The overall shell (264px sidebar, sticky topbar, 1320px content max-width) is good and stays. Lock regressions: D‑screenshots, viewport states, no rule changes except the ones below.
- [ ] Screenshot + metric capture 10 modules light/dark 1440×900 / 390×844
- [ ] Regression contract documented (sizes, sticky, blur, collapse 82)
- [ ] No code change → accept baseline

### Phase 1 — Collapsed sidebar (mini) — the point-1 pain
- [ ] Icon system: every nav-item gets an inline SVG (dashboard, users, trips, destinations, hotels, restaurants, countries, attractions, reviews, analytics, settings)
- [ ] 82px rail shows centered icon + active filled state; tooltip label on hover
- [ ] Width transition `.mode-collapsed` `.28s cubic-bezier(.2,.8,.2,1)`; reduced-motion: jump
- [ ] Brand monogram mark when collapsed (IT logo disc), wordmark hides
- [ ] Collapse button `aria-expanded` toggles, icon swaps (panel-left ↔ panel-right), centers in rail
- [ ] ⌘/Ctrl+B toggles sidebar; Esc in collapsed not clAp (no); Shift+tab order ok
- [ ] `.sidebar-foot` logout becomes icon button at rail center
Verify: `node --check`, puppeteer (sidebar 264↔82, labels hidden, tooltip on hover), no overflow.

### Phase 2 — User identity = menu (avatar/dropdown)
- [ ] Avatar circle with initials (name via session), role badge
- [ ] Dropdown: Files, Settings, separated Sign out; Esc + click-outside close; arrow-keys nav
- [ ] Focus-visible, aria-expanded synced; log out uses existing `session.logout`

### Phase 3 — Command palette (⌘K)
- [ ] Trigger: topbar icon**button**, ⌘/Ctrl+K, and `/` when search focused
- [ ] Panel: input + grouped results (Pages, Destinations, Hotels, Restaurants, Shortcuts…)
- [ ] load pages list from existing nav, data rows lazy from module maps (no heavy fetch)
- [ ] Arrow up/down navigate, Enter executes (navigate or toggle), Esc closes, click-outside
- [ ] `aria-modal`, `aria-labelledby`, role dialog; focus moves in/restores on close
Verify: puppeteer keyboard.

### Phase 4 — Page chrome: breadcrumb + identity + actions
- [ ] Breadcrumb rail (`Home · Destinations`), `aria-label="Breadcrumb"`, last crumb current page (no link)
- [ ] Action slot for primary page action (btn-new stays, aligns right)
- [ ] Sub-text keeps `view-sub`, `GATE ·` flavor retained as eyebrow accent

### Phase 5 — Datatable: column browsing & state
- [ ] Sticky header (`position:sticky; top:0` in `.table-scroll`), `aria-sort` retained
- [ ] Controls: `Columns` menu (checkbox show/hide), `Density` (compact/normal), `Page size` (10/25/50)
- [ ] Pagination meta “Showing 1–6 of 15” + Previous/Next + numbers
- [ ] Clearing/refresh states; empty grid unchanged

### Phase 6 — Datatable: actions + export + bulk
- [ ] Row actions (view/edit/delete icons) always visible on hover/focus
- [ ] Bulk select (checkbox per row) + footer bar “N selected → Delete CSV”
- [ ] Export CSV of current (filtered) rows client-side
- [ ] Keyboard select space when row focused

### Phase 7 — Dialog & form primitives hardening
- [ ] Dialog returns `role="dialog" aria-modal="true"`, title `aria-labelledby`, optional `aria-describedby`
- [ ] Focus trap in (Tab wrapper) on open, restore on close; focus first field; Enter=submit (no hidden submit), Esc=close
- [ ] Inline errors: field `<p class="field-error" id="">`, input `aria-describedby`, cleared on input; summary at top after failed submit
- [ ] Backdrop click = close (edit) or confirm (delete); confirm delete still in modal
Verify: Tab cycles only inside dialog; `Esc`; error message shown & read by SR.

### Phase 8 — Toast/status consolidation
- [ ] One `It.feedback.toast` used app-wide; success `role=status`, error `role=alert`
- [ ] Stacking limit 4, drain animation (exists); durable action variant (Undo stub) for delete
- [ ] Table important: `aria-live="polite"` on table region when refills

### Phase 9 — KPI widgets true
- [ ] Delta with actual baseline: from `/v1/admin/analytics?period=` — falls back to `—` when missing (existing)
- [ ] Per-KPI icon chip + label + value + delta
- [ ] Loading: KPI skeletons (3 cards) + booking rows skeleton
- [ ] Recent-bookings status → colored badges (pending/paid/cancelled)

### Phase 10 — Charts
- [ ] Add axes: gridlines, y-tick min/mid/max, x-labels
- [ ] Hover tooltip (value + label) via title/pointer
- [ ] Empty state (existing) + no data skeleton
- [ ] GSAP stagger-in (existing guard), with reduced-motion:
  animate transform only

### Phase 11 — Theme/token refinement
- [ ] `tokens.css`: `--radius`, `--ring`, elevation shadow scale (light/dark), no hardcoded `html.dark .badge-*`
- [ ] Theme tri-state: light/dark/**system** (`prefers-color-scheme`) selectable
- [ ] Contrast audit (badge-ok on dark etc AA), fix any ratio <4.5
- [ ] Global focus ring token applied everywhere; consistent radii

### Phase 12 — Mobile/off-canvas + sections
- [ ] <1024px: sidebar → fixed off-canvas drawer, hamburger in topbar, overlay click-close; Esc closes
- [ ] Nav scope: keep flat grouped nav, reject accordions/collapsible sections
- [ ] Tables scroll horizontally in `.table-scroll`; topbar wraps 640px
- [ ] Reduced-motion respected everywhere in new anims

### Phase 13 — A11y sweep
- [ ] `skip-link` (→ main), nav `aria-current="page"` on active
- [ ] All icons `aria-hidden` / button `aria-label`, focus visible on collapsed tooltip
- [ ] Keyboard smoke on 3 flows (login→dashboard, CRUD create/edit/delete, palette) — SR read ok
- [ ] No horizontal scroll at 390px or 1440px on any module

### Phase 14 — Final QA + docs
- [ ] `node --check` every `assets/js/*.js` (0 failures)
- [ ] Puppeteer sweep: 10 modules × (light/dark, collapse, search, modal, palette, 390px)
- [ ] `README.md`: Phase 18 section (sidebar mini, palette, breadcrumb, chart overview), assets `?v=`
- [ ] mark all Phase 0–14 acceptances `[x]` in `todo.md`, add Phase 18 verify log

## 6. Rejected scope (explicit)

- Horizontal-top layout & RTL — not applicable to product.
- React/Next/shadcn deps, TypeScript rewrite, Supabase/Firebase auth stacks (demo kit uses those).
- Real-time flows (WebSockets/online users), multi-tenant theming.
- Backend paging/sort-server promotion — already in contract (Ph17); frontend-only optimization; backend contract already settled in Phase 17.

---
*Generated 2026-08-07 · tasks/plan.md · suites: Ph0–14 (15 phases) — build from Phase 0 upward, verify at each checkpoint.*

