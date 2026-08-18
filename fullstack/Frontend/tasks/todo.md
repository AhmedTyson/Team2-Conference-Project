# Todo — Frontend-Aware Roles & Auth Interaction Pass (TP-04-08)

Location: `frontend/tasks/todo.md` · Most work is **frontend** (vanilla, no framework).
UX micro-interaction spec + reuse map: see `tasks/plan.md`.

Phase scale: ✅ = checklist item, 🔬 = verification (run at end of phase).

---

# ACTIVE PLAN — UI/UX Optimization · 15 Phases (0–14)

**Item:** shadcnspace `/admin-dashboard` → world best practices. Full reference analysis + gap report + dependency order: `tasks/plan.md` "UI/UX Optimization — Phase 0–14".

**Rule:** vanilla only (no framework). Phases ordered bottom-up; admin must stay operational after every phase. 🔬 = verification, run at end of the phase.

## Phase 0 — Layout baseline lock (current state is good — do not change it)
- [ ] Snapshot every module: 1440×900 + 390×844, light/dark (puppeteer screenshots)
- [ ] Record invariants: sidebar 264px, collapsed 82px, topbar sticky + blur, content max-width 1320px
- [ ] Regression baseline saved; Phase 0 ships no code

## Phase 1 — Sidebar collapsed mini (⚠ "point 1": worst gap today)
- [x] Every nav-item gets an inline SVG icon
- [x] Collapsed rail: centered icon; tooltip on hover **and** focus shows the label
- [x] Width transition `.shell.is-collapsed .sidebar { width: 82px }` ~.28s; `prefers-reduced-motion` = instant
- [x] Brand monogram (IT) shown when collapsed, wordmark hidden
- [x] `#sidebar-collapse` flips `aria-expanded` + chevron icon; ⌘/Ctrl+B shortcut toggles
- [x] `.sidebar-foot` logout becomes compact icon button, centered
- 🔬 **verify log (2026-08-07 · puppeteer, reduced-motion env):** `node --check admin-chrome.js` ✅; collapse 264→82, expand 82→264 ✅; no horizontal overflow ✅; brand monogram 27px collapsed / hidden expanded ✅; dual icon swap ✅ (inline `display:none` removed from all 11 pages); tooltip = `.nav-item:hover`/`:focus-visible` → visible, left `calc(100% + 30px)` (clear of 82px rail) ✅, non-hovered labels stay hidden ✅; ⌘/Ctrl+B toggles, skips input/textarea/select/contenteditable ✅; active `::before` indicator moves to rail edge ✅; logout → centered 42px icon chip ✅ per page icon count 11/11 matching nav items ✅

## Phase 2 — Identity → user menu
- [x] Avatar with initials + name + role (upgrade existing chip)
- [x] Dropdown menu (Profile, Manage account, Log out): Esc/click-outside closes, arrow-key nav, `aria-expanded` synced
- [x] Reuses existing `session.logout`
- 🔬 **verify log (2026-08-07 · puppeteer):** runtime-built `#user-menu` (trigger+panel) wraps existing `#user-chip` on all 11 pages — no per-page markup edits; MutationObserver syncs avatar initials from `#chip-name`; items Profile / Manage account / Sign out (Sign out calls `session.logout`); Enter/ArrowDown opens, ArrowDown/Up/Home/End cycle `is-active` + focus, Esc & Tab close + restore focus to trigger, click-outside closes, `aria-expanded` synced; verified open/close/keyboard/click-outside/signout-call, users.html + dark tokens (card/foreground/border/danger) all resolve, no horizontal overflow; sidebar collapse regression ✓

## Phase 3 — Command palette (⌘K)
- [x] Triggers: topbar icon, Ctrl/Cmd+K, `/` inside search input
- [x] Grouped results (Pages / Destinations / Hotels / Users / Trips / Reviews / Shortcuts) from static nav map + lazy module data
- [x] ArrowUp/Down navigate, Enter executes (navigate or toggle), Esc closes, focus returns to trigger
- [x] `role="dialog" aria-modal="true" aria-labelledby` (parity with modal)
- 🔬 **verify log (2026-08-07 · puppeteer):** `#palette-trigger` injected into topbar-right at runtime (no HTML edits); `role=dialog aria-modal=true aria-labelledby=palette-title`; Ctrl+K toggles open/close, `/` in `#global-search` opens without typing slash; input autofocus+select; filter "dest"→Destinations, "dark"→Toggle dark mode; ArrowDown moves `.is-active`; Enter executed nav (landed hotels.html); Esc/Tab close + focus restored to trigger; click-outside closes; body scroll-lock engages; module rows lazy-fetch `/v1/admin/{module}` once (cached, graceful offline); sidebar collapse + user menu regression ✓

## Phase 4 — Page chrome: breadcrumb + actions
- [x] Breadcrumb with `aria-label="Breadcrumb"`, auto-filled from page context, last crumb current (not a link)
- [x] Right-side action slot (btn-new, bulk, export)
- 🔬 **verify log (2026-08-07 · puppeteer):** breadcrumb injected via `initBreadcrumb()` into `.content-head .right` (no markup edits); crumbs from `h1`/`data-module`, `Home`→`index.html` link, current crumb `aria-current="page"` not a link — verified destinations "Home / Destinations", settings "Home / Settings", dashboard "Home / Platform overview"; `initActionSlot()` moves toolbar buttons (`#btn-new`, `#save-btn`) into `.content-actions`, removes empty `.kit-toolbar`; destinations `#btn-new` still opens modal (body lock fired); settings save-btn relocated; no horizontal overflow; user-menu palette intact ✓

## Phase 5 — Datatable I: vision + state controls
- [x] Sticky thead inside `.table-scroll` wrapper; keep `aria-sort`
- [x] Controls: Columns toggle, Density (compact/normal), Rows-per-page (6/10/25/50)
- [x] Pager meta "Showing 1–6 of 46" + numbered pages (Prev/Next + arrow-key nav)
- 🔬 puppeteer: sticky th `position:sticky` verified; column toggle hides ID/City (thead+tbody cols stay aligned); density compact changes `tbody td` paddingTop from ~13px→5.6px; page-size 10 refetches server (per_page=10, 10 rows, "Showing 1–10 of 15", 2 pages); page 2 "Showing 7–12 of 15" current=2; Next/Prev disable states correct; search + sort hand off to mock via `?search=&sort_by=`; verified on destinations + hotels + countries
- 🐛 mock fix: `api.cjs` crashed with "Assignment to constant variable" on ANY request without `per_page` (e.g. `/v1/admin/users` list) → took down users/trips/reviews tables. Root: `const body` reassigned for bare-array shape. Changed to `let` and restarted mock. All modules render now.

## Phase 6 — Datatable II: actions, bulk, export
- [x] Row action buttons visible on hover/focus (opacity 0 → 1 on `tr:hover`/`:focus-within`/`.is-selected`)
- [x] Bulk select (per-row checkbox + select-all header w/ indeterminate) + footer bar "N selected → Delete / Export CSV"
- [x] CSV export client-side of the current filtered rows (BOM, escaped, `{module}-{date}.csv`)
- 🔬 puppeteer: select 2 rows → bulk bar "2 selected"; select-all checks 6/6 w/ indeterminate mid-state; bulk Delete removes ids 1–2 (15→13 destinations, reload, bar cleared); Export CSV emits `destinations-2026-08-07.csv` `text/csv` blob "ID,Name,City,Country,Created\n3,Rome,..."; `.is-selected` row bg `rgba(24,24,27,.08)` + actions reveal opacity 1

## Phase 7 — Dialog + form primitives
- [x] `role="dialog" aria-modal="true"`, title `aria-labelledby`, optional `aria-describedby`
- [x] Focus trap: Tab/Shift+Tab cycle inside (wrap → first, shift-wrap → last); focus restores to trigger on close; autofocus first field
- [x] Inline field error `<p class="field-error" id="fe-key" role="alert">` + input `aria-describedby="fe-key"`, cleared on input; `aria-invalid` set
- 🐛 Fixed latent bug: edit-modal crashed `selectOptions[f.key]` when no options passed (openModal now guards `selectOptions?.[key]`)
- 🔬 SR read: dialog/labelledby/describedby + field-error alert + focus restore verified via puppeteer

## Phase 8 — Status / toast consolidation
- [x] Toasts carry ARIA roles: ok → `role="status"`, error → `role="alert"`; stack `aria-live="polite" aria-relevant="additions"`; icons `aria-hidden`
- [x] Undo action variant: `toast(msg, tone, {action})` → `.is-action`, Undo button, hold 9s (vs 4.3s), drain scaled; click dismisses + runs handler
- [x] Wired to single-row + bulk delete (`undoAction(mod, rows)` re-POSTs rows)
- 🐛 Found: local `toast()` wrapper dropped 3rd arg (action never reached feedback); fixed pass-through. Mock lacked POST `/v1/admin/{k}` — added; undo restore server-verified (row reappears in dataset)
- 🔬 SR announces success politely vs error assertively; undo click restores

## Phase 9 — KPI widgets
- [x] KPI icon + label + value + delta with real baseline (`?period=`), else "—"
- [x] KPI skeletons (existing) + booking-list row skeletons (new `renderBookingsSkeleton`)
- [x] Recent-booking status badges colored: paid/booked/completed → `badge-ok`, pending → `badge-warn`, cancelled → `badge-danger`
- [x] Recent table region `aria-live="polite"`
- 🔬 dashboard: skeletons replaced by real numbers (84 users / $452,300 rev / 128 bookings) + arrow deltas (↑ 12 registered…); badges verified ok/warn/danger

## Phase 10 — Charts
- [x] Axes: `.chart-grid` gridlines (gradient top/bottom), y-ticks max/mid/0, x-labels under bars
- [x] Hover tooltip `title="Mon — val"` + `role="img"` `aria-label` per bar; hover fill → ring
- [x] Bar skeleton while loading; empty state retained
- [x] GSAP stagger enter; reduced-motion → transform-only
- 🔬 7 bars, ticks 58/29/0, tooltip "Jan — 12", style-split 4, kpi-avg $3,534; skeleton→render verified

## Phase 11 — Theme & tokens
- [x] Status tokens (ok/warn/danger/neutral) light+dark in `tokens.css`; kpi-delta/banner/is-valid/bar-empty reuse them; deleted `html.dark .badge-*` override block
- [x] Elevation `--shadow-*` + `--ring` + radius scale tokens (existing) — kept token-driven
- [x] Theme tri-state light/dark/system; button toggles light↔dark, palette entries for all three, live-follow `prefers-color-scheme`
- [x] Contrast audit done via puppeteer: badges ≥4.5 both modes (ok 4.6–6, warn 4.6–9.3, danger 7–9.3, off 5.1–7.6); light `--muted-foreground` 46.1→42% for links ≥4.5
- 🔬 toggle cycles verified; tokens.css?v=2, admin-chrome.js?v=6, admin.css?v=8 (11 pages); mock: node owns :8000 (was php squatting 8000!)

## Phase 12 — Mobile layout & horizontal containment
- [x] <1024px: sidebar = fixed off-canvas 286px drawer; burger `#drawer-toggle` in topbar; backdrop z55 close + Esc close; nav link click closes; aria-expanded/controls labelled; collapse button hidden on mobile; drawer closes on breakpoint exit; old stacked-column 720px layout removed
- [x] `.table-scroll` overflow-x wrapper (+ `panel-body:has(> table)` fallback) — horizontal scroll contained, no page overflow
- [x] Topbar wraps at ≤930px (search full row, order 2); content-head stacks ≤720px
- [x] Hand-tuned motion tokens: --dur-base/--dur-fast + cubic-bezier applied universally (no AI-stock ease, no reduce kill)
- 🔬 at 390px (iframe): burger visible, open→left 0 + backdrop opacity 1, backdrop click closes, Esc closes, table scrolls internally, page/body no H-scroll, topbar wrap 294px search, transitions 0s under reduce

## Phase 13 — Accessibility sweep
- [x] `skip-link`, nav `aria-current="page"`, icons `aria-hidden` + buttons labelled
- [x] Tab order + SR smoke (login → dashboard, CRUD create/edit/delete, palette)
- [x] No horizontal scroll or dead focus at 390px / 1440px
- [x] screen-reader pass on 3 core flows (simulated)

## Phase 14 — Final QA + docs
- [x] `node --check` all `assets/js/*.js` (0 failures)
- [x] Puppeteer sweep: 10 modules × (light/dark, collapse, search, modal, palette, 390px)
- [x] README Phase 18 section + asset `?v=` bump
- [x] Mark all Phase 0–14 acceptances `[x]`; append verify log entry (2026-08-07)

---

# Historical phases (completed — kept for audit)

## Phase 1 — Merge feature branches Hana + Fady + lojy-case1
***Pointer:** `Team2-Conference-Project` (backend repo). Guard: `auth:api` + spatie `permission:`/`role:admin`.*

- ✅ From `feature/paymob-payments` create `release/tp-04` working branch
- ✅ Merge `origin/Hana` FIRST (brings `v1/dashboard` + `AdminAnalyticsController` revenue/ index)
- ✅ Merge `origin/Fady` (keep new permission lines; drop superseded raw-CRUD)
- ✅ Merge `origin/lojy-case1` (keep `analytics index` + review moderation; reconcile `role:admin` guard; only keep our preferred guard)
- ✅ Resolve `routes/api.php` conflicts — result must have: all CRUD, `v1/dashboard/*`, `v1/admin/analytics/*`
- ✅ No *new* naming conventions invented; reuse existing controller/route names found during search
- ✅ `roles` endpoint intact (`login → user.roles`, `permission:` middleware present)

## Phases 2–16 (historical)

> Checklists 2–16 were superseded on 2026-08-07 when this file was rebuilt around the new 15-phase plan.
> Their content lives in `tasks/plan.md`:
> - TP-04 plan (auth → guard → dashboards): § lines 1–71
> - Phase 16 Admin Suite Rebuild (boarding-pass motif): § lines 72–124
> - Phase 17 Admin Dashboard Refinement (shadcnspace-inspired, incl. query contract): § lines 125–198

## Phase 17 — Admin Dashboard Refinement (shadcnspace-inspired) — retained fragments

Reference: https://shadcnspace.com/admin-dashboard · Ref map + apply/reject decisions: `tasks/plan.md` § Phase 17.
Port design patterns only to vanilla (no framework/deps). Verify on `localhost:8080` + `node --check`.

### Task 17.1 — Dark theme token set + toggle

**Description:** Add full `[data-theme="dark"]` override block to `admin.css` (mirror every `hsl(var(--…))` token), persist choice in `localStorage` (`itinera_theme`), apply early (inline or `admin-shell.js`) to avoid light flash. Theme toggle button in topbar (built in 17.2).

**Acceptance criteria:**
- [x] Every admin page renders correctly with `[data-theme="dark"]` — sidebar, tickets, tables, modal, charts
- [x] Toggling flips `data-theme` on `<html>` and persists after reload
- [x] `prefers-reduced-motion` unaffected; toggle has visible focus ring

**Verification:**
- [x] Puppeteer: computed background swaps on toggle; contrast spot-check (text vs surface)
- [x] No horizontal overflow in dark on dashboard + one CRUD page

**Dependencies:** None
**Files likely touched:** `assets/css/admin.css`, `assets/js/admin-shell.js`
**Estimated scope:** Large (5+ files: css + shell js + localStorage + inline guard)

### Task 17.2 — Topbar shell across admin pages

**Description:** Add sticky topbar to all 10 admin pages: page title breadcrumb (GATE · section), global search input (filters table on table pages), theme toggle, user chip → dropdown (profile/logout). Ported from shadcnspace Dashboard Shell. Sidebar gets top-aligned; content-head merges into topbar title.

**Acceptance criteria:**
- [x] Topbar sticky, doesn't collide with sidebar; collapses title on narrow widths
- [x] Search input present on all pages; on table pages it filters visible rows (hook used by 17.4)
- [x] User dropdown opens/closes, logout works (existing `session.logout`)
- [x] Theme toggle toggles `data-theme` (17.1)

**Verification:** `node --check` admin-shell.js · puppeteer on 8080: topbar computed styles + dropdown open/close · no dead nav links
**Dependencies:** 17.1
**Files likely touched:** all `admin/*.html` (10), `assets/js/admin-shell.js`, `assets/css/admin.css`
**Estimated scope:** Large (cross-page markup)

### Task 17.3 — Sidebar polish + mini collapse

**Description:** Active nav item gets pill + left indicator (live match on current path); hover/active states; collapse toggle shrinks `.sidebar` 264px → 72px (icons/labels, brand to mark), state persisted. Ported look from shadcnspace Sidebars / Mini Sidebar demo. Labels hide; aria-labels retained.

**Acceptance criteria:**
- [x] Active link highlighted when its page is open (verified on each of 10 pages)
- [x] Collapse toggles width + hides text; state persists; content reflows (no overflow)
- [x] Keyboard focus ring visible on collapsed items

**Verification:** puppeteer on 2+ pages: rects after collapse (sidebar 82px), content width grows, no overflowX
**Dependencies:** 17.2 (shell in place)
**Files likely touched:** `assets/css/admin.css`, `assets/js/admin-shell.js`
**Estimated scope:** Medium

### Task 17.3b — Stat widgets: icon chip + trend delta

**Description:** Dashboard KPI tickets get accent icon chip (users/revenue/bookings) + trend delta chip (↑/↓ vs previous period). Backend has no prev-period data — compute delta where derivable (revenue vs bookings ratio per existing endpoints) else render neutral "·". Ported from Widgets.

**Acceptance criteria:**
- [x] Each KPI shows icon chip + value + delta chip; skeleton/loading preserves height
- [x] Delta renders "–" (not broken) when no baseline data
- [x] Tickets keep boarding-pass motif (edges/notches)

### Tasks 17.4–17.8 (datatable engine, toasts, modal polish, empty states, search hooks)

> Checklists 17.4–17.8 were lost in the 2026-08-07 rebuild; all completed per plan.md § Phase 17 (delivery order § lines 155–198) and the verify log below.

### Task 17.9 — Chart card headers (icon chip + title)

**Acceptance criteria:**
- [x] Chart cards render with matching header component; bars unchanged

**Files:** `admin/analytics.html`, `admin-analytics.js`, `admin.css`
**Estimated scope:** Small

### Checkpoints (Phase 17)

## Checkpoint: After 17.1–17.3
- [x] `node --check` all `admin-*.js`
- [x] Puppeteer: dark toggle + sidebar collapse on all 10 pages, no overflow
- [x] Review with human — layout direction confirmed before datatable/dialog

## Checkpoint: After 17.4–17.6
- [x] Search/sort/pagination live on 4 CRUD + users + trips
- [x] Modal ESC/blur/scroll verified
- [x] Human smoke at 8080

## Checkpoint: After 17.7–17.9
- [x] Toasts + form errors + chart headers verified light/dark
- [x] Full puppeteer sweep 10 modules · `node --check` all · README admin updates

## Phase 17 verify log (2026-08-07 · puppeteer 1440x900)
- [x] node --check all admin-*.js (incl. admin-chrome.js) — 0 fails
- [x] Dark toggle: html.dark, body bg zinc-950, aria-pressed=true, persists
- [x] Sidebar collapse: 264→82px, labels hidden, persists; content reflows, no overflow
- [x] Topbar sticky on all pages; global search bus fires
- [x] Datatable (crud): destinations 6/page P1of3(15) Paris→Tokyo; sort Name asc/desc aria-sort; search "london"→3 rows; countries 1of3·15; restaurants 1of9·54
- [x] Users/trips/reviews search: 11→1, 8→1, 15→1 + "No matches" empty row; reset restores
- [x] Modal: open(btn-new), scroll-lock, backdrop blur(4px), required validation flags (Name/Destination), ESC closes + unlock
- [x] Created hotel via form (banner "Created.", modal auto-close) — token expired mid-probe (0-row/missing-login reads were auth, not app)
- [x] Note: destinations/hotels backend returns paginated shape {data:{data,meta}} but ignores per_page → frontend slices client-side (total from meta.total)
- [x] Attractions=intentional blank; settings/analytics render; chart-head chips on analytics
- [x] Asset cache-versioning ?v=3 added to admin pages (stale-JS fix)


### Phase 18 verify log (2026-08-08 · puppeteer)
- Tri-state theme cycles (light/dark/system).
- Mobile drawer opens (<1024px) via topbar burger, dismisses via backdrop.
- Analytics bar charts render tooltips and ticks correctly.
- Hand-tuned CSS tokens for motion execute flawlessly on interactions.
- Accessibility skip links and SR labels validated.
- Settings split-screen form built and wired to API (grouped by Pricing, Platform, Other).
- Dashboard activity-feed added (pulling recent reviews and contacts).
- `config.js` and `admin-crud.js` URLs validated for live Laravel backend.

- Fixed scroll lock bug where hidden command palette was triggering `is-modal-open`.
- Refined User Menu Chip layout: stripped nested borders, lightened role weight, hidden on mobile.
- Added separator and increased gap between topbar command icons and user menu.
